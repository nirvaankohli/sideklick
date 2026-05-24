const express = require('express');
const app = express();
app.get('/health', (req, res) => {});
console.log('keys:', Object.keys(app));
console.log('_router:', app._router);
console.log('router:', app.router);
