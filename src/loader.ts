import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { compileScript, parse } from "vue/compiler-sfc";
import { transformSync } from "esbuild";
// @ts-expect-error no types necessary
import * as esmLoader from "@esbuild-kit/esm-loader";

require("@esbuild-kit/cjs-loader");

type MaybePromise<T> = T | Promise<T>;

type ModuleFormat =
  | "builtin"
  | "dynamic"
  | "commonjs"
  | "json"
  | "module"
  | "wasm"
  | "vue";

interface Resolved {
  url: string
  format: ModuleFormat
}

interface Context {
  conditions: string[]
  parentURL: string | undefined
}

type Resolve = (specifier: string, context: Context, defaultResolve: Resolve) => MaybePromise<Resolved>;

type Load = (
  url: string,
  context:
  {
    format: string
    importAssertions: Record<string, string>
  },
  defaultLoad: Load
) => MaybePromise<{
  format: string
  source: string | ArrayBuffer | SharedArrayBuffer | Uint8Array
}>;

export const resolve: Resolve = async function (specifier, context, defaultResolve) {
  const resolved = await defaultResolve(specifier, context, defaultResolve);
  if (resolved.url.endsWith(".vue")) {
    return {
      ...resolved,
      format: "vue",
    };
  }
  return esmLoader.resolve(specifier, context, defaultResolve);
};

let index = 1;

export const load: Load = async function (url, context, defaultLoad) {
  const loaded = await defaultLoad(url, context, defaultLoad);

  if (!loaded.source) return loaded;

  if (loaded.format === "vue") {
    const source = readFileSync(fileURLToPath(url), "utf-8");

    const sfc = parse(source);
    const { content } = compileScript(sfc.descriptor, {
      id: `${index++}`,
    });

    const { code } = transformSync(content, {
      loader: "ts",
      target: "es2017",
      format: "esm",
    });

    return {
      format: "module",
      source: code,
    };
  }
  return esmLoader.load(url, context, defaultLoad);
};
