import * as tf from "@tensorflow/tfjs";
import { MnistData } from ".";

export type Prediction = {
  image: tf.Tensor;
  prediction: number;
  label: number;
};

/**
 * Show predictions on a number of test examples.
 *
 * @param {tf.Model} model The model to be used for making the predictions.
 */
export const makePredictions = async (
  model: tf.LayersModel,
  data: MnistData,
  setPredictions: (ps: Prediction[]) => void,
) => {
  // Take 100 test exemplars
  const examples = data.getTestData(100);

  tf.tidy(() => {
    const output = model.predict(examples.xs);
    const axis = 1;
    const labels = Array.from(examples.labels.argMax(axis).dataSync());
    const predictions: number[] = Array.from(
      (output as tf.Tensor<tf.Rank>).argMax(axis).dataSync(),
    );

    const batch: { xs: tf.Tensor } = examples;

    const testExamples = batch.xs.shape[0];
    const predList: Prediction[] = [];

    for (let i = 0; i < testExamples; i++) {
      const image = batch.xs.slice([i, 0], [1, batch.xs.shape[1]!]);
      const prediction = predictions[i];
      const label = labels[i];
      predList.push({
        image,
        label,
        prediction,
      });
    }

    setPredictions(predList);
  });
};
