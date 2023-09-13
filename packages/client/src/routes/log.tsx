import { B, Header, Header2 } from "~/components/Ui";

export default function About() {
  return (
    <main class="mx-auto text-gray-700 max-w-[900px] p-4">
      <Header />

      <div class="flex flex-col space-y-6">
        <Header2>Log</Header2>
        <ol>
          <li>
            <p>
              <b>2023, September 26th:</b>
              The workbench is out. This represents the beginning, and it is
              difficult to say that this is federated learning as the protocol
              is entirely cut down to ensure release over perfection.
            </p>
            <p>
              As is aparent I decided to make this using TypeScript. Why not a
              Python notebook to explorer these techniques? Well, I might very
              well add that onto it (Well, probably Livebook as I am more into
              the Elixir ecosystem, but time will tell). First and foremost this
              is an investigation into <i>practical</i> federated learning. I
              want to ensure that I handle resource constraints of browsers,
              complexities of sending weights and models over the network. Error
              cases, etc.
            </p>
            <p>
              Currently the most grave error is that all clients train on the
              same dataset. For the next update, I am going to split the
              training set by label, so each client act i accordance with the
              description. Hopefully, this will uncover a worse performaning
              model for which I have to implement techniques to evaluate and
              develop the model.
            </p>
          </li>
        </ol>
      </div>
    </main>
  );
}
