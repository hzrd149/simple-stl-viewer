import { defineConfig } from "vite";

export default defineConfig({
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        main: "index.html",
        component: "src/component.ts",
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Place previewer.js at the root of dist
          if (chunkInfo.name === "component") {
            return "component.js";
          }
          return "assets/[name]-[hash].js";
        },
      },
    },
  },
});
