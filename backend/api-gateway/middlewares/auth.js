const jwt = require('jsonwebtoken');

// Middleware to verify JWT and user role
const authMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];  // Get token from Authorization header

    if (!token) {
      return res.status(403).json({ message: 'Token is required' });
    }

    // Verify the JWT token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
      
      // Attach the decoded user information to the request object (useful for further requests)
      req.user = decoded;

      // Check if the user's role is allowed to access this route
      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      next();  // User is authorized, proceed to the next middleware/route handler
    });
  };
};

module.exports = { authMiddleware };
