// @refresh reload
import { Suspense, createEffect, useContext } from "solid-js";
import {
  useLocation,
  A,
  Body,
  ErrorBoundary,
  FileRoutes,
  Head,
  Html,
  Meta,
  Routes,
  Scripts,
  Title,
} from "solid-start";
import "./root.css";
import { AppContext, AppStateProvider } from "./store";
import { PrivateSum } from "federated-learning";

const wsUrl = import.meta.env.VITE_API_URL ?? "ws://localhost:4000";

const Intializer = () => {
  const {
    party: [, setParty],
    privateSum: [, setPrivateSum],
  } = useContext(AppContext);

  createEffect(async () => {
    console.log("Connecting to", wsUrl);
    const ps = await new PrivateSum(
      {
        onNewParticipant: (participantId) => {
          setParty((p) => ({
            participants: [participantId, ...(p?.participants ?? [])],
          }));
        },
        onRemovedParticipant: (participantId) => {
          setParty((p) => ({
            participants: (p?.participants ?? []).filter(
              (p) => p !== participantId
            ),
          }));
        },
        onReady: () => {},
      },
      wsUrl
    ).init();

    setPrivateSum(ps);
  });
  return null;
};

export default function Root() {
  const location = useLocation();
  const active = (path: string) =>
    path == location.pathname
      ? "border-sky-600"
      : "border-transparent hover:border-sky-600";

  return (
    <AppStateProvider>
      <Intializer />
      <Html lang="en">
        <Head>
          <Title>Federated Learning Workbench</Title>
          <Meta charset="utf-8" />
          <Meta name="viewport" content="width=device-width, initial-scale=1" />
          <script
            async
            src="https://a.madsbuch.com/script.js"
            data-website-id="46d68be2-8880-42ad-966c-c23ff3fa6db8"
          ></script>
        </Head>
        <Body>
          <Suspense>
            <ErrorBoundary>
              <nav class="bg-sky-800">
                <ul class="container flex items-center p-3 text-gray-200">
                  <li class={`border-b-2 ${active("/")} mx-1.5 sm:mx-6`}>
                    <A href="/">Home</A>
                  </li>
                  <li class={`border-b-2 ${active("/about")} mx-1.5 sm:mx-6`}>
                    <A href="/about">About</A>
                  </li>
                  <li class={`border-b-2 ${active("/log")} mx-1.5 sm:mx-6`}>
                    <A href="/log">Log</A>
                  </li>
                </ul>
              </nav>
              <Routes>
                <FileRoutes />
              </Routes>
            </ErrorBoundary>
          </Suspense>
          <Scripts />
        </Body>
      </Html>
    </AppStateProvider>
  );
}
