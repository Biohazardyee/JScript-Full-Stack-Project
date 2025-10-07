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

        if (JWT.verify(token, process.env.JWT_SECRET)) {
        
            next();
        }
        else {
            res.status(401).json({
                success: false,
                error: "Token doesn't match"
            })
        }

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Error while processing your request",
            details: error.message,
        })
    }
}

module.exports = JWTmiddleware; 