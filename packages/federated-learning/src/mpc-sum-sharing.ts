import * as tf from "@tensorflow/tfjs";
import { ModelWeights, SumObj, WsMsg, prepMsg } from "./codec";
import {
  algorithm,
  decryptAfterDecode,
  encodePublicKey,
  encryptAndEncode,
} from "./crypto";
import { modelShapes } from ".";

type PrivatePart = {
  // Number of batches the dataset has been trained on
  trainedBatches: number;

  // Weights of the model.
  // TODO: This needs a better encoding than a double nested list
  modelWeights: tf.Tensor[];
};

// These are used to hook into state life cycle of the PrivateSum
export type PrivateSumCallbacks = {
  onNewParticipant: (id: string) => void;
  onRemovedParticipant: (id: string) => void;
  onReady: () => void;
};

/**
 * MPC protocol used to calculate and send a LayerModel to the server.
 */
export class PrivateSum {
  private keyPair?: CryptoKeyPair;
  private encodedPublicKey?: string;
  private partySize?: number;

  private privateRisidual?: PrivatePart;
  private piecesToShare?: PrivatePart[];
  private socket?: WebSocket;

  // Internal state
  private socketReady = false;

  // List of private keys representing friends
  private friends: { publicKey: string; piece?: PrivatePart }[] = [];

  private model?: ModelWeights;
  private onNewModelSet?: () => void;

  constructor(
    private cb: PrivateSumCallbacks,
    private url: string,
  ) {}

  /**
   * Retrieves the model for this current cluster
   */
  async retrieveModel() {
    return new Promise<ModelWeights>((resolve, reject) => {
      this.onNewModelSet = () => {
        delete this.onNewModelSet;
        if (this.model) {
          resolve(this.model);
        } else {
          reject("An error happened");
        }
      };
      this.socket?.send(
        prepMsg({
          methodName: "getModel",
        }),
      );
    });
  }

  async init() {
    return new Promise<PrivateSum>((resolve, reject) => {
      this.socket = new WebSocket(this.url);
      this.socket.addEventListener("open", (e) => {
        this.socketReady = true;
        this.cb.onReady();
        resolve(this);
      });
      this.socket.addEventListener("message", (e) => {
        this.onMessage(WsMsg.parse(JSON.parse(e.data.toString())));
      });
    });
  }

  /**
   * Enroll but do not commence exchange yet
   */
  async enroll() {
    if (!this.socketReady) {
      throw Error("Scoket not readys");
    }
    const keyPair = await crypto.subtle.generateKey(algorithm, true, [
      "encrypt",
      "decrypt",
    ]);
    this.keyPair = keyPair;

    const encodedPublicKey = await encodePublicKey(keyPair);
    this.encodedPublicKey = encodedPublicKey;

    this.socket?.send(
      prepMsg({
        methodName: "enroll",
        encodedPublicKey: encodedPublicKey,
      }),
    );
  }

  /**
   * This class holds both transport layer functionality (WS) and facilitates
   * the protocol. For now, that is alright
   */
  async start(privateNumber: PrivatePart) {
    const privatePart = privateNumber;

    if (
      this?.partySize &&
      privatePart &&
      this.friends.length === this.partySize - 1
    ) {
      const batchPieces = splitInt(privatePart.trainedBatches, this.partySize);
      const weightPieces = splitTensors(
        privatePart.modelWeights,
        this.partySize,
      );

      this.privateRisidual = {
        trainedBatches: batchPieces.pop()!,
        modelWeights: weightPieces.pop()!,
      };
      this.piecesToShare = batchPieces.map((bp, i) => {
        return {
          trainedBatches: bp,
          modelWeights: weightPieces[i],
        };
      });

      if (this.piecesToShare.length !== this.friends.length)
        throw Error("Lengths does not match");

      await Promise.all(
        this.friends.map(async (friend, i) => {
          const piece: SumObj = {
            trainedBatches: this.piecesToShare![i].trainedBatches,
            modelWeights: await Promise.all(
              this.piecesToShare![i].modelWeights.map(async (mw) => [
                ...(await mw.data()),
              ]),
            ),
          };
          this.socket?.send(
            prepMsg({
              methodName: "sendPiece",
              from: this.encodedPublicKey!,
              to: friend.publicKey,

              // Encrypted
              piece: JSON.stringify(
                await encryptAndEncode(friend.publicKey, JSON.stringify(piece)),
              ),
            }),
          );
        }),
      );
    } else {
      return false;
    }
  }

  async onMessage(m: WsMsg) {
    if (m.methodName === "configuration") {
      this.partySize = m?.numberOfFriends;
    } else if (m?.methodName === "enroll") {
      this.friends?.push({ publicKey: m.encodedPublicKey });
      this.cb.onNewParticipant(m.encodedPublicKey);
    } else if (m.methodName === "sendPiece") {
      // Receiving a piecefrom another client
      const friend = this.friends.find((f) => f.publicKey === m.from);

      if (friend && this.keyPair) {
        // Decrypt first
        const json = JSON.parse(
          await decryptAfterDecode(this.keyPair, JSON.parse(m.piece)),
        );
        const piece = SumObj.parse(json);

        friend.piece = {
          trainedBatches: piece.trainedBatches,
          modelWeights: piece.modelWeights.map((mw, i) =>
            tf.tensor(mw, modelShapes[i]),
          ),
        };
      }

      // See if all
      if (!this.friends.find((f) => f.piece === undefined)) {
        // Sum everything up!
        const totalPartialSum = this.friends
          .map((e) => e.piece)
          .reduce(
            (prev, cur) => {
              return {
                trainedBatches: prev?.trainedBatches! + cur?.trainedBatches!,
                modelWeights: addListOfTensors(
                  cur?.modelWeights!,
                  prev?.modelWeights!,
                ),
              };
            },
            {
              trainedBatches: this.privateRisidual?.trainedBatches!,
              modelWeights: this.privateRisidual?.modelWeights!,
            },
          );

        // And send it to the server
        new Promise(async () => {
          const promises = totalPartialSum?.modelWeights.map(async (mw) =>
            Array.from(await mw.data()),
          );
          if (!promises) {
            throw new Error("No promises");
          }

          const mw = await Promise.all(promises);

          if (!totalPartialSum) {
            throw new Error("totalPartialSum not set");
          }
          if (!this.encodedPublicKey) {
            throw new Error("this.encodedPublicKey not set");
          }

          const partialSum = {
            trainedBatches: totalPartialSum.trainedBatches,
            modelWeights: mw,
          };
          this.socket?.send(
            prepMsg({
              methodName: "sendPartialSum",
              from: this.encodedPublicKey,
              partialSum: partialSum,
            }),
          );
        });

        // Give it some time to settle
        setTimeout(() => {
          this.socket?.send(
            prepMsg({
              methodName: "getModel",
            }),
          );
        }, 500);
      } else {
        // console.log("Not all pieces are in yet")
      }
    } else if (m.methodName === "model") {
      // Retrieved the model.
      this.model = m.model;
      this.onNewModelSet && this.onNewModelSet();
    }
  }
}

/**
 * Takes a model and creates n pieces.
 *
 * We heavily rely on a known network architecture for this
 *
 * @param model
 * @param pieces
 * @returns
 */
export const splitTensors = (
  weights: tf.Tensor<tf.Rank>[],
  n: number,
): tf.Tensor<tf.Rank>[][] => {
  const randomPieces = [...new Array(n)].map((_) => {
    // Create a structure with random tensors
    return weights.map((t) => tf.randomUniform(t.shape, -0.99, 0.99));
  });

  const risidual = subListOfTensors(
    weights,
    randomPieces.reduce((p, t) => addListOfTensors(p, t)),
  );
  return [...randomPieces, risidual];
};

/**
 * Takes a list of pieces and creates a model
 *
 * @param pieces
 * @returns
 */
export const assembleTensors = (pieces: tf.Tensor[][]): tf.Tensor[] => {
  return pieces.reduce((p, t) => addListOfTensors(p, t));
};

export const splitInt = (x: number, n: number): number[] => {
  const randomPieces = [...new Array(n - 1)].map(
    (_s) => Math.floor(Math.random() * 1000) + 1,
  );
  const risidual = x - randomPieces.reduce((p, c) => p + c, 0);
  return [...randomPieces, risidual];
};

export const combineInts = (ns: number[]): number => {
  return ns.reduce((p, c) => p + c, 0);
};

// Util
export const addListOfTensors = (
  t1: tf.Tensor[],
  t2: tf.Tensor[],
): tf.Tensor[] => {
  return t1.map((t11, i) => t11.add(t2[i]));
};
export const subListOfTensors = (
  t1: tf.Tensor[],
  t2: tf.Tensor[],
): tf.Tensor[] => {
  return t1.map((t11, i) => t11.sub(t2[i]));
};
export const weightAsArray = (model: tf.LayersModel) =>
  Promise.all(model.getWeights().map(async (w) => Array.from(await w.data())));
