import * as tf from "@tensorflow/tfjs";
import { MnistData, Prediction, PrivateSum } from "federated-learning";
import { createContext, createSignal } from "solid-js";
import { createStore } from "solid-js/store";

type Party = { participants: string[] };

type CtxType = {
  predictions?: ReturnType<typeof createStore<Prediction[]>>;

  data: ReturnType<typeof createSignal<MnistData | null>>;
  privateSum: ReturnType<typeof createSignal<PrivateSum | null>>;
  party: ReturnType<typeof createSignal<Party | null>>;
  model: ReturnType<typeof createSignal<tf.LayersModel | null>>;
  privateDelta: ReturnType<
    typeof createSignal<{ weights: tf.Tensor[]; batchCount: number } | null>
  >;
};

export const AppContext = createContext<CtxType>({
  model: createSignal<tf.LayersModel | null>(null),
  data: createSignal<MnistData | null>(null),
  party: createSignal<Party | null>(null),
  privateSum: createSignal<PrivateSum | null>(null),
  privateDelta: createSignal<{
    weights: tf.Tensor[];
    batchCount: number;
  } | null>(null),
});

export function AppStateProvider(props: any) {
  const predictions = createStore<Prediction[]>([]);

  const data = createSignal<MnistData | null>(null);
  const privateSum = createSignal<PrivateSum | null>(null);
  const model = createSignal<tf.LayersModel | null>(null);
  const party = createSignal<Party | null>(null);
  const privateDelta = createSignal<{
    weights: tf.Tensor[];
    batchCount: number;
  } | null>(null);

  return (
    <AppContext.Provider
      value={{ predictions, model, privateSum, party, privateDelta, data }}
    >
      {props.children}
    </AppContext.Provider>
  );
}
