const JWT = require('jsonwebtoken')

function JWTmiddleware(req, res, next) {
    var authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'Authorization header missing or malformed'
        });
    }
    var token = authHeader.slice(7).trim();
    try {
        if (token === '') {
            return res.status(401).json({
                success: false,
                error: 'Your token is empty'
            })
        }

        const decoded = JWT.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user info to request
        next();

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Error while processing your request",
            details: error.message,
        })
    }
}

module.exports = JWTmiddleware; 