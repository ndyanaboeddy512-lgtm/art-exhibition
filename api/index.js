// Vercel Serverless Function entry point
const app = require('../server.js');

module.exports = (req, res) => {
  const original = req.headers['x-matched-path'] || 
                   req.headers['x-vercel-matched-path'] || 
                   req.headers['x-original-url'] ||
                   req.headers['x-forwarded-uri'];
  if (original) {
    req.url = original;
  }
  return app(req, res);
};
