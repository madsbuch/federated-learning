import { For, useContext } from "solid-js";
import { AppContext } from "~/store";
import * as tf from "@tensorflow/tfjs";

const draw = (image: tf.Tensor, canvas: HTMLCanvasElement) => {
  const [width, height] = [28, 28];
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
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
};

export default function Evaluator() {
  const { predictions: predicitons } = useContext(AppContext);
  return (
    <div class="grid grid-cols-10 max-w-[900px]">
      <For each={predicitons?.[0]}>
        {({ image, label, prediction }) => {
          const correct = prediction === label;

          if (!image) {
            return null;
          }

          const canvas = document.createElement("canvas");
          draw(image, canvas);

          return (
            <div
              class={`h-full w-full border flex flex-row ${
                correct ? "bg-green-500" : "bg-red-500"
              }`}
            >
              <div class="flex-grow p-2 font-bold text-white">{prediction}</div>
              {canvas}
            </div>
          );
        }}
      </For>
    </div>
  );
}
