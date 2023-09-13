import { useContext } from "solid-js";
import { AppContext } from "~/store";
import { Button } from "./Ui";

export default function ModelShare() {
  const {
    party: [party, setParty],
    privateSum: [ps],
    privateDelta: [privateDelta],
  } = useContext(AppContext);

  const shareModel = async () => {
    const psProtocol = ps();
    const trainingData = privateDelta();

    if (psProtocol && trainingData) {
      psProtocol.start({
        trainedBatches: trainingData.batchCount,
        modelWeights: trainingData.weights,
      });
    }
  };
  return (
    <Button disabled={privateDelta() === null} onClick={shareModel}>
      Parivately Share Trained Diff ({(party()?.participants.length ?? 0) + 1}{" "}
      of 3)
    </Button>
  );
}
