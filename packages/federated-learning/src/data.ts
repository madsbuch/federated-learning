import * as tf from "@tensorflow/tfjs";

// TODO: This file uses the DOM to parse images. This needs to be updated
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

export const IMAGE_H = 28;
export const IMAGE_W = 28;
const IMAGE_SIZE = IMAGE_H * IMAGE_W;
const NUM_CLASSES = 10;
const NUM_DATASET_ELEMENTS = 65000;

const NUM_TRAIN_ELEMENTS = 55000;

const MNIST_IMAGES_SPRITE_PATH = "/mnist_images.png";
const MNIST_LABELS_PATH = "/mnist_labels_uint8";

/**
 * A class that fetches the sprited MNIST dataset and provide data as
 * tf.Tensors.
 */
export class MnistData {
  datasetImages = new Float32Array();
  trainImages = new Float32Array();
  testImages = new Float32Array();

  datasetLabels = new Uint8Array();
  trainLabels = new Uint8Array();
  testLabels = new Uint8Array();

  /**
   * Because we use this for federated learning, we create datasets that
   * only contain a single label out of the possible. This function will
   * make sure that only a single label is represented in the dataset.
   *
   * We do this inorder to be able to use the original data source without
   * altering it. For a proof of concept this is fine, though it would not
   * work for production use cases.
   */
  filterOnLabel(n: number) {}

  async load() {
    // Make a request for the MNIST sprited image.
    // @ts-ignore
    const img = new Image();
    // @ts-ignore
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Load labels
    const labelsRequest = await fetch(MNIST_LABELS_PATH);
    this.datasetLabels = new Uint8Array(await labelsRequest.arrayBuffer());

    // Load Images
    await new Promise<void>((resolve, reject) => {
      img.crossOrigin = "";
      img.onload = () => {
        img.width = img.naturalWidth;
        img.height = img.naturalHeight;

        const datasetBytesBuffer = new ArrayBuffer(
          NUM_DATASET_ELEMENTS * IMAGE_SIZE * 4,
        );

        const chunkSize = 5000;
        canvas.width = img.width;
        canvas.height = chunkSize;

        for (let i = 0; i < NUM_DATASET_ELEMENTS / chunkSize; i++) {
          const datasetBytesView = new Float32Array(
            datasetBytesBuffer,
            i * IMAGE_SIZE * chunkSize * 4,
            IMAGE_SIZE * chunkSize,
          );
          ctx?.drawImage(
            img as any,
            0,
            i * chunkSize,
            img.width,
            chunkSize,
            0,
            0,
            img.width,
            chunkSize,
          );

          const imageData = ctx?.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
          );

          if (!imageData) {
            throw new Error("No image data");
          }

          for (let j = 0; j < imageData.data.length / 4; j++) {
            // All channels hold an equal value since the image is grayscale, so
            // just read the red channel.
            datasetBytesView[j] = imageData.data[j * 4] / 255;
          }
        }
        this.datasetImages = new Float32Array(datasetBytesBuffer);

        resolve();
      };
      img.src = MNIST_IMAGES_SPRITE_PATH;
    });

    // Slice the the images and labels into train and test sets.
    this.trainImages = this.datasetImages.slice(
      0,
      IMAGE_SIZE * NUM_TRAIN_ELEMENTS,
    );

    this.testImages = this.datasetImages.slice(IMAGE_SIZE * NUM_TRAIN_ELEMENTS);

    this.trainLabels = this.datasetLabels.slice(
      0,
      NUM_CLASSES * NUM_TRAIN_ELEMENTS,
    );

    this.testLabels = this.datasetLabels.slice(
      NUM_CLASSES * NUM_TRAIN_ELEMENTS,
    );
  }

  /**
   * Get all training data as a data tensor and a labels tensor.
   *
   * @returns
   *   xs: The data tensor, of shape `[numTrainExamples, 28, 28, 1]`.
   *   labels: The one-hot encoded labels tensor, of shape
   *     `[numTrainExamples, 10]`.
   */
  getTrainData() {
    const xs = tf.tensor4d(this.trainImages, [
      this.trainImages.length / IMAGE_SIZE,
      IMAGE_H,
      IMAGE_W,
      1,
    ]);

    const labels = tf.tensor2d(this.trainLabels, [
      this.trainLabels.length / NUM_CLASSES,
      NUM_CLASSES,
    ]);
    return { xs, labels };
  }

  /**
   * Get all test data as a data tensor and a labels tensor.
   *
   * @param {number} numExamples Optional number of examples to get. If not
   *     provided,
   *   all test examples will be returned.
   * @returns
   *   xs: The data tensor, of shape `[numTestExamples, 28, 28, 1]`.
   *   labels: The one-hot encoded labels tensor, of shape
   *     `[numTestExamples, 10]`.
   */
  getTestData(numExamples: number | null = null) {
    let xs = tf.tensor4d(this.testImages, [
      this.testImages.length / IMAGE_SIZE,
      IMAGE_H,
      IMAGE_W,
      1,
    ]);
    let labels = tf.tensor2d(this.testLabels, [
      this.testLabels.length / NUM_CLASSES,
      NUM_CLASSES,
    ]);

    if (numExamples != null) {
      xs = xs.slice([0, 0, 0, 0], [numExamples, IMAGE_H, IMAGE_W, 1]);
      labels = labels.slice([0, 0], [numExamples, NUM_CLASSES]);
    }
    return { xs, labels };
  }
}
