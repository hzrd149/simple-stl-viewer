import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        previewer: resolve(__dirname, "src/previewer.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Place previewer.js at the root of dist
          if (chunkInfo.name === "previewer") {
            return "previewer.js";
          }
          return "assets/[name]-[hash].js";
        },
      },
    },
  },
});
