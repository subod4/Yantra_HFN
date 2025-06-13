const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  console.log('Auth Middleware Triggered');
  console.log('Request Headers:', req.headers);
  console.log('Request Body:', req.headers.authorization);

  const authHeader = req.headers.authorization;
console.log('Authorization Header:', authHeader);
  if (!authHeader || !authHeader.startsWith('Bearer')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided'
    });
  }

  const token = authHeader.replace('Bearer', '').trim();
  console.log('Token:', token);


  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

module.exports = authMiddleware;
