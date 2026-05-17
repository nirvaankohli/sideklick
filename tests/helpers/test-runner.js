let test;

try {
  ({ test } = require("bun:test"));
} catch {
  test = require("node:test");
}

module.exports = {
  test,
};
