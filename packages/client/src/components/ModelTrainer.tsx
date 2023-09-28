import {
  createConvModel,
  load,
  makePredictions,
  train,
} from "federated-learning";
import { useContext } from "solid-js";
import { AppContext } from "~/store";
import { Button } from "./Ui";

export default function ModelTrainer() {
  const {
    predictions,
    model,
    privateDelta: [, setPrivateDelta],
    data: [dataState],
  } = useContext(AppContext);

  const m = model?.[0] ?? (() => null);

  const startTraining = async () => {
    const data = dataState();

    // It is strongly assumed that the model is present here, as the button
    // otherwise is disabled.
    const model = m();

    if (!model || !data) {
      return;
    }

    const modelForTraining = createConvModel();
    modelForTraining.setWeights(model.getWeights());

    const trainMetrics = await train(modelForTraining, data, {
      onIteration: (...args) => {
        makePredictions(modelForTraining, data, (ps) => predictions?.[1](ps));
      },
    });

    // Calculate diff
    const prevM = model.getWeights();
    const newM = modelForTraining.getWeights();

    const deltaWeights = prevM.map((prev, i) => prev.sub(newM[i]));

    console.log(
      "Model delta",
      await Promise.all(
        deltaWeights.map(async (w) => Array.from(await w.data())),
      ),
    );
    console.log("Batch count", trainMetrics.trainBatchCount);

    setPrivateDelta({
      weights: deltaWeights,
      batchCount: trainMetrics.trainBatchCount,
    });
  };

  return (
    <Button onClick={startTraining} disabled={!m()}>
      Train the model for 1 eopch
    </Button>
  );
}
