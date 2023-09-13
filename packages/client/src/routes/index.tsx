import { A } from "solid-start";
import Evaluator from "~/components/Evaluator";
import { Header } from "~/components/Ui";
import ModelTrainer from "~/components/ModelTrainer";
import ModelLoad from "~/components/ModelLoad";
import ModelShare from "~/components/ModelShare";

export default function Home() {
  return (
    <main class="mx-auto text-gray-700 max-w-[900px] p-4">
      <Header />

      <div class="flex flex-col sm:flex-row space-y-6 sm:space-y-0 sm:space-x-6 mb-6">
        <div class="sm:w-1/2 w-full space-y-4">
          <p>
            The case is simple: 10 people each know how to write a number. They
            all want to develop an algorithm that can recognize handwritten
            letters, but no one wants to share their number. Federated learning
            and a private sum protocol to the rescue. This page demonstrates a
            demo protocol that can do just this. The protocol has 2 main pieces:
          </p>

          <p>
            This investigation into federated learning is based on the{" "}
            <a
              class="underline hover:text-blue-500"
              target="_blank"
              href="https://storage.googleapis.com/tfjs-examples/mnist/dist/index.html"
            >
              tfjs MNIST example
            </a>
            .
          </p>
          <p>
            For more information see the{" "}
            <A href="/about" class="underline hover:text-blue-500">
              {" "}
              about page
            </A>
            .
          </p>
        </div>

        <div class="flex-1 flex flex-col space-y-6">
          <ModelLoad />

          <ModelTrainer />

          <ModelShare />
        </div>
      </div>

      <Evaluator />
    </main>
  );
}
