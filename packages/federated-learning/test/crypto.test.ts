import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-cpu";
import { expect, test } from "bun:test";
import { createConvModel } from "../src";
import { algorithm, decryptAfterDecode, encryptAndEncode } from "../src/crypto";
import { weightAsArray } from "../src/mpc-sum-sharing";

test("Encryption / Decryption is isomorph", async () => {
  const keyPair = await crypto.subtle.generateKey(algorithm, true, [
    "encrypt",
    "decrypt",
  ]);
  const { publicKey } = keyPair;
  const publicKeyEncoded = btoa(
    JSON.stringify(await crypto.subtle.exportKey("jwk", publicKey)),
  );
  expect(
    await decryptAfterDecode(
      keyPair,
      await encryptAndEncode(publicKeyEncoded, "42"),
    ),
  ).toEqual("42");
});

test("Encrypts and decrypts tensors", async () => {
  const keyPair = await crypto.subtle.generateKey(algorithm, true, [
    "encrypt",
    "decrypt",
  ]);
  const { publicKey } = keyPair;
  const publicKeyEncoded = btoa(
    JSON.stringify(await crypto.subtle.exportKey("jwk", publicKey)),
  );

  const obj = JSON.stringify({
    batches: 42,
    weights: await tf.tensor([11, 23, 33]).data(),
  });
  const recovered = await decryptAfterDecode(
    keyPair,
    await encryptAndEncode(publicKeyEncoded, obj),
  );
  expect(recovered).toEqual(obj);

  // A test like this will ensure integrity of the underlying lib, ie, TensorFlow.
  // We are relying on stability of their API and want to test for that.
  expect(JSON.parse(recovered)).toEqual({
    batches: 42,
    weights: { "0": 11, "1": 23, "2": 33 },
  });
});

test("Can recover an encrypted model after decryption", async () => {
  const keyPair = await crypto.subtle.generateKey(algorithm, true, [
    "encrypt",
    "decrypt",
  ]);
  const { publicKey } = keyPair;
  const publicKeyEncoded = btoa(
    JSON.stringify(await crypto.subtle.exportKey("jwk", publicKey)),
  );

  const model = createConvModel();
  model.compile({
    optimizer: "rmsprop",
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  const weightData = await weightAsArray(model);

  const weightShapes = model.getWeights().map((w) => w.shape);
  const obj = JSON.stringify({
    batches: 42,
    weights: {
      weightData: weightData,
      weightShapes: weightShapes,
    },
  });

  const encrypted = await encryptAndEncode(publicKeyEncoded, obj);
  const decrypted = await decryptAfterDecode(keyPair, encrypted);

  expect(decrypted).toEqual(obj);

  const returnObj = JSON.parse(decrypted);
  const tensors = returnObj.weights.weightData.map(
    (data: number[], index: number) => {
      return tf.tensor(data, returnObj.weights.weightShapes[index]);
    },
  );

  const model1 = createConvModel();
  model1.setWeights(tensors);

  expect(await weightAsArray(model)).toEqual(await weightAsArray(model1));
});
