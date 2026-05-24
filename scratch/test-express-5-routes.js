const express = require('express');
const app = express();
app.get('/health', (req, res) => {});
app.get(['/a', '/b'], (req, res) => {});
console.log(app.router.stack.map(layer => ({
  path: layer.route.path,
  methods: layer.route.methods
})));
