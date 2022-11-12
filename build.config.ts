import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: [
    "src/preflight",
    "src/cli",
    "src/loader",
    "src/suppress-warnings",
    "src/loader",
  ],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
  },
  failOnWarn: false,
});
