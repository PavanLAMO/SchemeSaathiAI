/**
 * Vercel Serverless Function Entrypoint
 * Routes all /api/* requests to SchemeSaathi backend requestHandler
 */

const { requestHandler } = require('../backend/server');

module.exports = async (req, res) => {
  return requestHandler(req, res);
};
