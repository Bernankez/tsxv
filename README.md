# tsx-vue
[![npm](https://img.shields.io/npm/v/tsxv?color=blue&label=npm)](https://www.npmjs.com/package/tsxv)

Run Typescript & ESM files and automatically compile imported Vue files. Forked from [esbuild-kit/tsx](https://github.com/esbuild-kit/tsx), but removed REPL and watch mode.

**Notice:** If you are compiling Vue files, manually install Vue as a dependency.

**Use for [Bobo Style](https://github.com/Bernankez/bobo-style)**

## Usage

Install it as a development dependency:
```
npm install -D tsxv
```
And reference it directly in the `package.json#scripts`:
```
{
  "scripts":{
    "dev": "tsxv ..."
  }
}
```
Or just call it with npx while in the project directory:
```
npx tsxv ...
```