import Module = require('module');
export default function requireFromString(
  src: string,
  filename: string
): NodeModule {
  const m = new Module(filename, module.parent ?? undefined);
  m._compile(src, filename);
  return m.exports;
}
