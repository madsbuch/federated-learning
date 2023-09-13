import * as tf from '@tensorflow/tfjs';
import { IMAGE_H, IMAGE_W, MnistData } from './data';

/**
 * Creates a convolutional neural network (Convnet) for the MNIST data.
 *
 * @returns {tf.Model} An instance of tf.Model.
 */
export const createConvModel = (): tf.LayersModel => {
    const model = tf.sequential();
    model.add(tf.layers.conv2d({
        inputShape: [IMAGE_H, IMAGE_W, 1],
        kernelSize: 3,
        filters: 16,
        activation: 'relu',
    }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2, strides: 2 }));
    model.add(tf.layers.conv2d({ kernelSize: 3, filters: 32, activation: 'relu' }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2, strides: 2 }));
    model.add(tf.layers.conv2d({ kernelSize: 3, filters: 32, activation: 'relu' }));
    model.add(tf.layers.flatten({}));
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 10, activation: 'softmax' }));
    return model;
}

export const createDenseModel = () => {
    const model = tf.sequential();
    model.add(tf.layers.flatten({ inputShape: [IMAGE_H, IMAGE_W, 1] }));
    model.add(tf.layers.dense({ units: 42, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 10, activation: 'softmax' }));
    return model;
}

type TrainingCallbacks = {
    onIteration?: (event: string, batch: number, logs?: tf.Logs) => void
    logStatus?: (status: string) => void
    plotLoss?: (trainBatchCount: number, logs: number, set: 'train' | 'validation') => void
    plotAccuracy?: (trainBatchCount: number, accuracy: number, set: 'train' | 'validation') => void
}

export const train = async (
    model: tf.LayersModel,
    data: MnistData,
    cb: TrainingCallbacks) => {
    if (cb?.logStatus) cb?.logStatus('Training model...');

    model.compile({
        optimizer: "rmsprop",
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy'],
    });

    const batchSize = 320;
    const validationSplit = 0.15;
    const trainEpochs = 1;
    let trainBatchCount = 0;

    const trainData = data.getTrainData();
    const testData = data.getTestData();

    const totalNumBatches =
        Math.ceil(trainData.xs.shape[0] * (1 - validationSplit) / batchSize) *
        trainEpochs;

    // During the long-running fit() call for model training, we include
    // callbacks, so that we can plot the loss and accuracy values in the page
    // as the training progresses.
    let valAcc: number = 0;

    const trainD = trainData.xs
    const trainL = trainData.labels

    await model.fit(trainD, trainL, {
        batchSize,
        validationSplit,
        epochs: trainEpochs,
        callbacks: {
            onBatchEnd: async (batch, logs) => {
                trainBatchCount++;
                if (cb.logStatus) cb.logStatus(
                    `Training... (` +
                    `${(trainBatchCount / totalNumBatches * 100).toFixed(1)}%` +
                    ` complete). To stop training, refresh or close page.`);
                if (logs) {
                    if (cb.plotLoss) cb.plotLoss(trainBatchCount, logs.loss, 'train');
                    if (cb.plotAccuracy) cb.plotAccuracy(trainBatchCount, logs.acc, 'train');
                }
                if (cb.onIteration && batch % 10 === 0) {
                    cb.onIteration('onBatchEnd', batch, logs);
                }
                await tf.nextFrame();
            },
            onEpochEnd: async (epoch, logs) => {

                if (logs) {
                    valAcc = logs.val_acc;
                    if (cb.plotLoss) cb.plotLoss(trainBatchCount, logs.val_loss, 'validation');
                    if (cb.plotAccuracy) cb.plotAccuracy(trainBatchCount, logs.val_acc, 'validation');
                }


                if (cb.onIteration) {
                    cb.onIteration('onEpochEnd', epoch, logs);
                }
                await tf.nextFrame();
            }
        }
    });

    const testResult = model.evaluate(testData.xs, testData.labels);

    const testAccPercent = (testResult as tf.Scalar[])[1].dataSync()[0] * 100;
    const finalValAccPercent = (valAcc as number) * 100;
    if (cb.logStatus) cb.logStatus(
        `Final validation accuracy: ${finalValAccPercent.toFixed(1)}%; ` +
        `Final test accuracy: ${testAccPercent.toFixed(1)}%`);

    return {
        trainBatchCount
    }
}


export const load = async (dataset: number): Promise<MnistData> => {
    const data = new MnistData();
    await data.load();
    data.filterOnLabel(dataset)
    return data
}
