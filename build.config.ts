import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: [
    "src/preflight",
    "src/cli",
    "src/loader",
    "src/suppress-warnings",
    "src/require",
  ],
  declaration: false,
  clean: true,
  rollup: {
    emitCJS: true,
    esbuild: {
      minify: true,
    },
  },
  failOnWarn: false,
});
