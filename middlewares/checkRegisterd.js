const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET;
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  
    // Check if token has expired
    if (decodedToken.exp < Date.now() / 1000) {
      return res.status(401).json({ error: 'Unauthorized: Token expired' });
    }
  console.log(decodedToken)
    // Set the user ID in the request object
    req.user = { _id: decodedToken.id, role: decodedToken.role };
    console.log(req.user)
    next();
  });
}

module.exports = { authenticateToken };
