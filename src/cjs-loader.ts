import Module from "node:module";
import { readFileSync } from "node:fs";
import type { TransformOptions } from "esbuild";
import { compileScript, parse } from "vue/compiler-sfc";
import { transformSync } from "esbuild";
import {
  transformSync as _transformSync,
  compareNodeVersion,
  installSourceMapSupport,
  transformDynamicImport,
} from "@esbuild-kit/core-utils";
import { getTsconfig, parseTsconfig } from "get-tsconfig";
import { require } from "./require";

require("@esbuild-kit/cjs-loader");

let index = 1;

const tsconfig = process.env.ESBK_TSCONFIG_PATH
  ? {
      path: process.env.ESBK_TSCONFIG_PATH,
      config: parseTsconfig(process.env.ESBK_TSCONFIG_PATH),
    }
  : getTsconfig();

const tsconfigRaw = tsconfig?.config;

const applySourceMap = installSourceMapSupport();

const nodeSupportsImport
  // v13.2.0 and higher
  = compareNodeVersion([13, 2, 0]) >= 0
  // 12.20.0 ~ 13.0.0
  || (compareNodeVersion([12, 20, 0]) >= 0 && compareNodeVersion([13, 0, 0]) < 0);

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
    if (transformed) {
      code = applySourceMap(transformed, filePath);
    }
  } else {
    const transformed = _transformSync(source, filePath, {
      tsconfigRaw: tsconfigRaw as TransformOptions["tsconfigRaw"],
    });

    code = applySourceMap(transformed, filePath);
  }

  module._compile(code, filePath);
}

[".vue"].forEach((extension) => {
  extensions[extension] = transformer;
});
