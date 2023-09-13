/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import * as tf from '@tensorflow/tfjs';
import { Prediction } from './store';
import { MnistData } from "federated-learning"

export function logStatus(message: string) {
    console.log("Log Status", message)
}

export function trainingLog(message: string) {
    console.log("Training Log:", message)
}

export function showTestResults(batch: { xs: tf.Tensor },
    predictions: number[],
    labels: number[],
    setPredictions: (ps: Prediction[]) => void) {
    const testExamples = batch.xs.shape[0];
    const predList: Prediction[] = []

    for (let i = 0; i < testExamples; i++) {
        const image = batch.xs.slice([i, 0], [1, batch.xs.shape[1]!]);
        const prediction = predictions[i];
        const label = labels[i];
        predList.push({
            image, label, prediction
        })
    }

    setPredictions(predList)
}

const lossValues: { x: number, y: number }[][] = [[], []];
export function plotLoss(batch: number, loss: number, set: "train" | "validation") {
    const series = set === 'train' ? 0 : 1;
    lossValues[series].push({ x: batch, y: loss });
    console.log(`last loss: ${loss.toFixed(3)}`);
}

const accuracyValues: { x: number, y: number }[][] = [[], []];
export function plotAccuracy(batch: number, accuracy: number, set: "train" | "validation") {
    const series = set === 'train' ? 0 : 1;
    accuracyValues[series].push({ x: batch, y: accuracy });
    console.log(`last accuracy: ${(accuracy * 100).toFixed(1)}%`);
}

export function draw(image: tf.Tensor, canvas: HTMLCanvasElement) {
    const [width, height] = [28, 28];
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const imageData = new ImageData(width, height);
    const data = image.dataSync();
    for (let i = 0; i < height * width; ++i) {
        const j = i * 4;
        imageData.data[j + 0] = data[i] * 255;
        imageData.data[j + 1] = data[i] * 255;
        imageData.data[j + 2] = data[i] * 255;
        imageData.data[j + 3] = 255;
    }
    ctx?.putImageData(imageData, 0, 0);
}

/**
 * Show predictions on a number of test examples.
 *
 * @param {tf.Model} model The model to be used for making the predictions.
 */
export const showPredictions = async (model: tf.LayersModel, data: MnistData, setPredictions: (ps: Prediction[]) => void) => {

    // Take 100 test exemplars
    const examples = data.getTestData(100);


    tf.tidy(() => {
        const output = model.predict(examples.xs);
        const axis = 1;
        const labels = Array.from(examples.labels.argMax(axis).dataSync());
        const predictions: number[] = Array.from((output as tf.Tensor<tf.Rank>).argMax(axis).dataSync());

        showTestResults(examples, predictions, labels, setPredictions);
    });
}