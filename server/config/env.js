const dotenv = require('dotenv');
const { DEFAULT_PORT } = require('./constants');

dotenv.config();

const PORT = Number(process.env.PORT) || DEFAULT_PORT;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
const DATABASE_URL = process.env.DATABASE_URL || process.env.DB_URI;

if (!JWT_SECRET) {
  console.warn('JWT_SECRET is not set. Auth will not work correctly.');
}
if (!DATABASE_URL) {
  console.warn('DATABASE_URL is not set. Prisma will not connect.');
}

module.exports = {
  PORT,
  NODE_ENV,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  DATABASE_URL,
};
