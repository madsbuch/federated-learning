import { createConvModel, load } from "federated-learning";
import { useContext } from "solid-js";
import { AppContext } from "~/store";
import * as tf from "@tensorflow/tfjs";
import { showPredictions } from "~/ui";

export default function ModelLoad() {
  const state = useContext(AppContext);
  const {
    model: [model, setModel],
    privateSum: [privateSum],
    data: [data, setData],
    predictions,
  } = state;

  const loadModel = async () => {
    setData(await load(0));
    privateSum()?.enroll();
    const model = await privateSum()?.retrieveModel();
    const tensors = model?.weightData.map((data: number[], index: number) => {
      return tf.tensor(data, model.weightShapes[index]);
    });

    const d = data();

    if (tensors && d) {
      const mod = createConvModel();
      mod.setWeights(tensors);
      setModel(mod);
      showPredictions(mod, d, (ps) => predictions?.[1](ps));
    } else {
      console.error("Error loading model", !!tensors, !!d);
    }
  };
  return (
    <button
      class="w-full rounded-full bg-gray-100 border-2 border-gray-300 focus:border-gray-400 active:border-gray-400 px-[2rem] py-[1rem]"
      onClick={loadModel}
    >
      Load Model and Join Party
    </button>
  );
}
