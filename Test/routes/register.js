var express = require('express')
var router = express.Router()

const bcrypt = require('bcrypt')
const User = require('../config/database');


router.post('/', async function (req, res, next) {
    const { email, password, roles } = req.body;
    const existingUser = await User.findOne({ email })
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email already exists'
            })
        }

        if (!password || password.trim().length < 8) {
            return res.status(422).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        const newUser = new User({
            email: email.trim(),
            password: hashedPassword,
            roles: ['user']
        });
        await newUser.save();

        res.status(201).json({
            success: true,
            message: 'Added user',
            data: `User n°${newUser.id}, email: ${newUser.email} with roles: ${newUser.roles} was created`
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to create new user',
            error: error.message
        })
    }
})

module.exports = router;