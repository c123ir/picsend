const express = require('express');
const router = express.Router();
const authService = require('./auth.service');
const { loggers } = require('../utils/logger');

const logger = loggers.auth;

router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const result = await authService.login(username, password);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

router.post('/register', async (req, res, next) => {
    try {
        const result = await authService.register(req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

router.post('/sms/send', async (req, res, next) => {
    try {
        const { phone } = req.body;
        const result = await authService.sendVerificationSMS(phone);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

module.exports = router; 