const dotenv = require('dotenv');
const { DEFAULT_PORT } = require('./constants');

dotenv.config();

const PORT = Number(process.env.PORT) || DEFAULT_PORT;
const NODE_ENV = process.env.NODE_ENV || 'development';

module.exports = {
  PORT,
  NODE_ENV,
};
