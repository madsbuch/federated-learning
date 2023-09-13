import { B, Header, Header2 } from "~/components/Ui";

export default function About() {
  return (
    <main class="mx-auto text-gray-700 max-w-[900px] p-4">
      <Header />

      <div class="flex flex-col sm:flex-row space-y-6 sm:space-y-0 sm:space-x-6">
        <div class="w-full sm:w-1/2 ">
          <p>
            <b>Federated learning for the MNIST data set:</b>
            The case is simple: 10 people each know how to write a number. They
            all want to develop an algorithm that can recognize handwritten
            letters, but no one wants to share their number. Federated learning
            to the rescue. This page demonstrates a demo protocol that can do
            just this. The protocol has 2 main pieces:
          </p>
          <ol class="list-decimal space-y-2 p-4">
            <li>
              Retrieve and train a model with the local data. For this
              exposition we use a convolutional neural network. For now we
              merely need to fetch weights for the model.
            </li>
            <li>
              Share the delta from the training using a secure sharing scheme.
              Initially this is based on multi party computation (MPC).
            </li>
          </ol>

          <p>
            This is a place where I try out different approaches to training,
            aggregation and evaluation for models privately trained using
            federated learning.
          </p>
        </div>

        <div class="flex flex-col space-y-4">
          <Header2>Resources:</Header2>
          <ul class="list-disc space-y-2 p-4">
            <li>
              <a
                class="underline hover:text-sky-500"
                target="_blank"
                href="https://github.com/madsbuch/federated-learning"
              >
                GitHub Repository for this project
              </a>
            </li>
            <li>Differential Privacy for Secure Aggregation</li>
            <li>
              <a
                class="underline hover:text-sky-500"
                target="_blank"
                href="https://storage.googleapis.com/tfjs-examples/mnist/dist/index.html"
              >
                The tfjs MNIST example
              </a>
            </li>
            <li>
              <a
                class="underline hover:text-sky-500"
                target="_blank"
                href="https://www.cis.upenn.edu/~aaroth/Papers/privacybook.pdf"
              >
                The Algorithmic Foundations of Differential Privacy
              </a>
            </li>
          </ul>

          <Header2>Future work</Header2>
          <ul class="list-disc space-y-2 p-4">
            <li>
              Implement secure aggregation using differential privacy. <B>FL</B>
            </li>
            <li>
              Federated evaluation <B>FL</B>
            </li>
            <li>
              Find models that better suite a federated setting <B>FL</B>
            </li>
            <li>
              Use a blockchain as a central server <B>BCFL</B> (Potentially look
              into tokenomics <B>BCFL</B>)
            </li>
            <li>
              Improve transport layer for model-weights. <B>Eng.</B>
            </li>
            <li>
              Implement model agnostisicm. <B>Eng.</B>
            </li>
            <li>
              Use Livebook to evaluate on the backend. <B>Eng.</B>
            </li>
          </ul>
          <p>
            My expectation is that most of this already has publications on it.
          </p>
        </div>
      </div>
    </main>
  );
}
