var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt')
const jsonwebtoken = require('jsonwebtoken')
const User = require('../config/database');

router.post('/', async function (req, res, next) {
    try {

        const { email, password } = req.body;

        const user = await User.findOne({ email })

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (isValidPassword) {
            const token = jsonwebtoken.sign({
                userId: user._id,
                email: user.email,
                roles: user.roles
            },
                process.env.JWT_SECRET
            );
            res.status(200).json({
                success: true,
                token: token,
                user: {
                    id: user._id,
                    email: user.email,
                    roles: user.roles
                }
            })
        }
        else {
            return res.status(401).json({
                success: false,
                message: "Invalid password or email credentials"
            })
        }
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: "Error while processing your request",
            details: error.message,
        })
    }
})

module.exports = router;