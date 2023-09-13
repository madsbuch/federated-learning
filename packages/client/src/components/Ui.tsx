import { JSX } from "solid-js";

export const Header = () => {
  return (
    <header class="text-center w-full">
      <h1 class="text-4xl text-sky-700 font-thin uppercase my-10">
        Federated Learning Workbench
      </h1>
    </header>
  );
};

export const Header2 = (props: any) => {
  return (
    <header class="text-center w-full">
      <h2 class="text-2xl text-sky-700 font-thin uppercase">
        {props.children}
      </h2>
    </header>
  );
};

export const B = (props: any) => {
  return (
    <span class="text-sm bg-sky-700 text-white font-thin rounded-md shadow-sm px-1 py-0.5">
      {props.children}
    </span>
  );
};

export const Button = (props: {
  disabled: boolean;
  onClick: (
    e: MouseEvent & { currentTarget: HTMLButtonElement; target: Element }
  ) => void;
  children: any;
}) => {
  return (
    <button
      class="w-full disabled:text-gray-300 disabled:border-gray-300 rounded-full bg-gray-100 border-2 border-gray-300 focus:border-gray-400 active:border-gray-400 px-[2rem] py-[1rem]"
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {props.children}
    </button>
  );
};
