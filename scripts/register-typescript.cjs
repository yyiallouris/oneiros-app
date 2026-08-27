/**
 * Minimal local TypeScript require hook for repository scripts.
 *
 * This intentionally uses the already-installed TypeScript compiler so live
 * review commands do not depend on `npx` downloading a runner at execution time.
 */
const fs = require('fs');
const ts = require('typescript');

require.extensions['.ts'] = function registerTypeScript(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
    reportDiagnostics: false,
  });
  module._compile(output.outputText, filename);
};
