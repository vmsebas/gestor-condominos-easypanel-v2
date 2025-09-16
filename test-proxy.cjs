const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Test proxy configuration
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:3002',
  changeOrigin: true,
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxying:', req.method, req.originalUrl, '->', proxyReq.path);
  }
}));

app.listen(5174, () => {
  console.log('Test proxy running on port 5174');
});