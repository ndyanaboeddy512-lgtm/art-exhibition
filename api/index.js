// Vercel Serverless Function entry point
const app = require('../server.js');

module.exports = (req, res) => {
  if (req.headers['x-matched-path']) {
    req.url = req.headers['x-matched-path'];
  }
  return app(req, res);
};
