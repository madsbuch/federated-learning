import { z } from "zod";

export const SumObj = z.object({
  trainedBatches: z.number(),
  modelWeights: z.number().array().array(),
});
export type SumObj = z.infer<typeof SumObj>;

const ModelWeights = z.object({
  weightShapes: z.any(), // This is number array of variable rank.
  weightData: z.number().array().array(),
});
export type ModelWeights = z.infer<typeof ModelWeights>;

const ModelLayer = z.object({
  // Number of batches the model-diff was trained on
  batches: z.number(),
  modelDelta: ModelWeights,
  parent: z.string().optional(),
  deltaId: z.string(),
});
export type ModelLayer = z.infer<typeof ModelLayer>;

export const WsMsg = z
  .object({
    methodName: z.literal("enroll"),
    encodedPublicKey: z.string(),
  })
  .or(
    z.object({
      methodName: z.literal("sendPiece"),
      from: z.string(),
      to: z.string(),
      piece: z.string(), // Encrypted SumObj
    }),
  )
  .or(
    z.object({
      methodName: z.literal("sendPartialSum"),
      partialSum: SumObj,
      from: z.string(),
    }),
  )
  .or(
    z.object({
      methodName: z.literal("configuration"),
      numberOfFriends: z.number(),
    }),
  )
  .or(
    z.object({
      methodName: z.literal("error"),
      reason: z.string(),
    }),
  )
  .or(
    z.object({
      methodName: z.literal("getModel"),
    }),
  )
  .or(
    z.object({
      methodName: z.literal("model"),
      model: ModelWeights,
    }),
  );

export type WsMsg = z.infer<typeof WsMsg>;

export const prepMsg = (m: WsMsg) => JSON.stringify(m);
