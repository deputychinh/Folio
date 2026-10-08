// Vercel function. Every /api/* request is rewritten here (vercel.json) and
// handed to the NestJS app, which is built once per function instance.
module.exports = require('../apps/api/dist/serverless.js').default;
