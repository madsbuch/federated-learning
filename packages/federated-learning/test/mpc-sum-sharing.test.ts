import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-cpu";
import { expect, test } from "bun:test";
import { createConvModel } from "../src";
import {
  addListOfTensors,
  assembleTensors,
  combineInts,
  splitInt,
  splitTensors,
  subListOfTensors,
  weightAsArray,
} from "../src/mpc-sum-sharing";

test("Can add list of tensors", async () => {
  const t = (es: number[]) => tf.tensor(es);

  const t1 = [t([1, 1]), t([2, 2])];
  const result = addListOfTensors(t1, [t([1, 1]), t([2, 2])]);

  expect(await Promise.all(t1.map(async (e) => [...(await e.data())]))).toEqual(
    [
      [1, 1],
      [2, 2],
    ],
  );
  expect(
    await Promise.all(result.map(async (e) => [...(await e.data())])),
  ).toEqual([
    [2, 2],
    [4, 4],
  ]);
});

test("Can sub list of tensors", async () => {
  const t = (es: number[]) => tf.tensor(es);
  const t1 = [t([1, 1]), t([2, 2])];
  const result = subListOfTensors(t1, [t([1, 1]), t([2, 2])]);

  expect(await Promise.all(t1.map(async (e) => [...(await e.data())]))).toEqual(
    [
      [1, 1],
      [2, 2],
    ],
  );
  expect(
    await Promise.all(result.map(async (e) => [...(await e.data())])),
  ).toEqual([
    [0, 0],
    [0, 0],
  ]);
});

test("Can split and combine ints", () => {
  expect(combineInts(splitInt(4, 10))).toBe(4);
});

test("Can split and combine models", async () => {
  const model1 = createConvModel();
  const model2 = createConvModel();

  expect(await weightAsArray(model1)).not.toEqual(await weightAsArray(model2));

  const modelTensors = model1.getWeights();

  const splitModelTensors = splitTensors(modelTensors, 3);
  const recontructedModelTensors = assembleTensors(splitModelTensors);

  model2.setWeights(recontructedModelTensors);

  // Normalize to only compare on the first 6 decimals (Artifact of floats)
  const normalized1 = model1
    .getWeights()
    .map(async (t) => [...(await t.mul(1000000).floor().div(1000000).data())]);
  const normalized2 = model2
    .getWeights()
    .map(async (t) => [...(await t.mul(1000000).floor().div(1000000).data())]);

  expect(normalized1).toEqual(normalized2);
});

test("Can split and combine models in many pieces", async () => {
  const model1 = createConvModel();
  const model2 = createConvModel();

  expect(await weightAsArray(model1)).not.toEqual(await weightAsArray(model2));

  const modelTensors = model1.getWeights();

  const splitModelTensors = splitTensors(modelTensors, 100);
  const recontructedModelTensors = assembleTensors(splitModelTensors);

  model2.setWeights(recontructedModelTensors);

  // Normalize to only compare on the first 6 decimals (Artifact of floats)
  const normalized1 = model1
    .getWeights()
    .map(async (t) => [...(await t.mul(1000000).floor().div(1000000).data())]);
  const normalized2 = model2
    .getWeights()
    .map(async (t) => [...(await t.mul(1000000).floor().div(1000000).data())]);

  expect(normalized1).toEqual(normalized2);
});
