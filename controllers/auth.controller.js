const AuthService = require('../services/auth.service');
const { registrationSchema, loginSchema } = require('../validators/auth.validator');
const logger = require('../utils/logger');

class AuthController {
  async register(req, res) {
    try {
      // Validate request body
      const { error, value } = registrationSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      // Add profile image path if uploaded
      if (req.file) {
        value.profileImage = req.file.path;
      }

      const user = await AuthService.register(value);
      res.status(201).json({ message: 'Registration successful', user });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(400).json({ message: error.message });
    }
  }

  async login(req, res) {
    try {
      // Validate request body
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const { email, password } = value;
      const result = await AuthService.login(email, password);

      res.json({
        message: 'Login successful',
        user: result.user,
        token: result.token
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(401).json({ message: error.message });
    }
  }
}

module.exports = new AuthController();
