import { For, useContext } from "solid-js";
import { AppContext } from "~/store";
import { draw } from "~/ui";

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
