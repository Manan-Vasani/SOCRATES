const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token for a given user ID
 * @param {string} id - User ID
 * @returns {string} Signed JWT token
 */
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'socrates_secret_jwt_key_2026_dev';
  const expiresIn = process.env.JWT_EXPIRE || '30d';

  return jwt.sign({ id }, secret, {
    expiresIn,
  });
};

module.exports = generateToken;
