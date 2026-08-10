const jwt = require('jsonwebtoken');

// In a real deployment, set JWT_SECRET as an environment variable.
// Falling back to a default so it works out of the box for local use.
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-please';

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, SECRET, {
    expiresIn: '30d',
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (e) {
    return null;
  }
}

module.exports = { signToken, verifyToken, SECRET };
