import { defineConfig } from "vite";
import solid from "solid-start/vite";
import netlify from "solid-start-netlify";

export default defineConfig({
  plugins: [solid({ adapter: netlify() })],
});
// import solid from "solid-start/vite";
// import { defineConfig } from "vite";

// export default defineConfig({
//   plugins: [solid()],
// });
