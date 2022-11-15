import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: [
    "src/preflight",
    "src/cli",
    "src/suppress-warnings",
    "src/loader",
    "src/cjs-loader",
    "src/esm-loader",
  ],
  declaration: false,
  clean: true,
  rollup: {
    emitCJS: true,
    inlineDependencies: true,
    esbuild: {
      minify: true,
    },
  },
  failOnWarn: false,
});
