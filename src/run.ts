import type { StdioOptions } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path, { dirname } from "node:path";
import spawn from "cross-spawn";
import { require } from "./require";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function run(
  argv: string[],
  options?: {
    noCache?: boolean;
    tsconfigPath?: string;
    ipc?: boolean;
  },
) {
  const environment = { ...process.env };
  const stdio: StdioOptions = [
    "inherit", // stdin
    "inherit", // stdout
    "inherit", // stderr
    "ipc", // parent-child communication
  ];

  if (options) {
    if (options.noCache) { environment.ESBK_DISABLE_CACHE = "1"; }

    if (options.tsconfigPath) { environment.ESBK_TSCONFIG_PATH = options.tsconfigPath; }
  }

  return spawn(
    process.execPath,
    [
      "--require",
      require.resolve(path.resolve(__dirname, "./preflight.cjs")),

      "--loader",
      pathToFileURL(require.resolve(path.resolve(__dirname, "./loader.cjs"))).toString(),

      ...argv,
    ],
    {
      stdio,
      env: environment,
    },
  );
}
