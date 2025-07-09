const bootstrapPromise = require('../dist/main.js').default();

module.exports = async (req, res) => {
  const app = await bootstrapPromise;
  return app(req, res);
};