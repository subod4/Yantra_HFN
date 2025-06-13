const { signup, login } = require('../controllers/AuthController');
const { signupValidation, loginValidation } = require('../middlewares/AuthValidation');

const router = require('express').Router();

// Signup Route
router.post('/signup', signupValidation, signup);

// Login Route
router.post('/login', loginValidation, login);

module.exports = router;
