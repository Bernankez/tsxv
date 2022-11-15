import Module from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { compileScript, parse } from "vue/compiler-sfc";
import type { TransformOptions } from "esbuild";
import { transformSync } from "esbuild";
import { transformSync as _transformSync, compareNodeVersion, installSourceMapSupport, transformDynamicImport } from "@esbuild-kit/core-utils";
import { getTsconfig, parseTsconfig } from "get-tsconfig";
// @ts-expect-error no types necessary
import * as esmLoader from "@esbuild-kit/esm-loader";
import { require } from "./require";

require("@esbuild-kit/cjs-loader");

let index = 1;

const tsconfig = (
  process.env.ESBK_TSCONFIG_PATH
    ? {
        path: process.env.ESBK_TSCONFIG_PATH,
        config: parseTsconfig(process.env.ESBK_TSCONFIG_PATH),
      }
    : getTsconfig()
);

const tsconfigRaw = tsconfig?.config;

const applySourceMap = installSourceMapSupport();

const nodeSupportsImport = (
  // v13.2.0 and higher
  compareNodeVersion([13, 2, 0]) >= 0

  // 12.20.0 ~ 13.0.0
  || (
    compareNodeVersion([12, 20, 0]) >= 0
    && compareNodeVersion([13, 0, 0]) < 0
  )
);

const extensions = Module._extensions;
function transformer(module: Module, filePath: string) {
  if (process.send) {
    process.send({
      type: "dependency",
      path: filePath,
    });
  }

  const source = readFileSync(filePath, "utf8");
  const sfc = parse(source);
  const { content } = compileScript(sfc.descriptor, {
    id: `${index++}`,
  });
  const _transformed = transformSync(content, {
    loader: "ts",
    target: "es2017",
    format: "cjs",
  });
  let code = _transformed.code;

  if (nodeSupportsImport) {
    const transformed = transformDynamicImport(filePath, code);
    if (transformed) { code = applySourceMap(transformed, filePath); }
  } else {
    const transformed = _transformSync(
      source,
      filePath,
      {
        tsconfigRaw: tsconfigRaw as TransformOptions["tsconfigRaw"],
      },
    );

    code = applySourceMap(transformed, filePath);
  }

  module._compile(code, filePath);
}
[".vue"].forEach((extension) => {
  extensions[extension] = transformer;
});

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
  url: string;
  format: ModuleFormat;
}

interface Context {
  conditions: string[];
  parentURL: string | undefined;
}

type Resolve = (specifier: string, context: Context, defaultResolve: Resolve) => MaybePromise<Resolved>;

type Load = (
  url: string,
  context:
  {
    format: string;
    importAssertions: Record<string, string>;
  },
  defaultLoad: Load
) => MaybePromise<{
  format: string;
  source: string | ArrayBuffer | SharedArrayBuffer | Uint8Array;
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

export const load: Load = async function (url, context, defaultLoad) {
  const loaded = await defaultLoad(url, context, defaultLoad);

  if (!loaded.source) { return loaded; }

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
