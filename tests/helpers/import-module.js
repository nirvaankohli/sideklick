const { pathToFileURL } = require("node:url");

async function importModule(modulePath) {
  const imported = await import(pathToFileURL(modulePath).href);
  return imported.default ?? imported;
}

module.exports = {
  importModule,
};
