const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    try {
        // Retrieve token from headers
        const token = req.header('x-token');
        if (!token) {
            console.error('No token provided');
            return res.status(401).json({ message: 'Token not found' });
        }
        
        // Verify token
        jwt.verify(token, process.env.JWT_SECRET || 'jwtSecret', (err, decoded) => {
            if (err) {
                console.error('Token verification failed:', err);
                return res.status(401).json({ message: 'Invalid token' });
            }

            // Attach user to request object
            req.user = decoded.user;
            next();
        });
    } catch (err) {
        console.error('Middleware error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
