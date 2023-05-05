const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user'); // import the User model
const Lottery = require('../models/lottery'); // import the Lottery model
const PasswordResetToken = require('../models/PasswordResetToken'); // import the PasswordResetToken model
const SECRET_KEY = process.env.JWT_SECRET;
// Routes that use the models go here

module.exports = router;

//sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const { isAdmin } = require('../middlewares/isAdmin');
const { authenticateToken } = require('../middlewares/checkRegisterd')
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/signup', async (req, res) => {
  try {
    const { username, email, confirmEmail, password, confirmPassword, role } = req.body;

    // Check if email and confirmEmail match
    if (email !== confirmEmail) {
      return res.status(400).json({ error: 'Email and confirmEmail do not match.' });
    }

    // Check if password and confirmPassword match
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Password and confirmPassword do not match.' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists.' });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role
    });

    res.status(201).json({ id: newUser.id, username: newUser.username, email: newUser.email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});
// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Find the user by email
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Compare password with hashed password in the database
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Create a JWT token with the user ID as payload
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

  // Send back the token and user information
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email
    }
  });
});

router.post('/forgot_password', authenticateToken,async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const token = generatePasswordResetToken();
    const expirationTime = new Date(Date.now() + 3600000); // One hour from now
    const passwordResetToken = await PasswordResetToken.create({
      token,
      user_id: user._id, // Use the correct attribute name for MongoDB
      expires_at: expirationTime,
    });
    if (!passwordResetToken) {
      return res.status(500).json({ error: 'Failed to create password reset token' });
    }
    // send password reset email to user's email address
    sendPasswordResetEmail(user.email, token);
    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// POST /reset_password
router.post('/reset_password', authenticateToken, async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;
    const passwordResetToken = await PasswordResetToken.findOne({ token });
    if (!passwordResetToken || passwordResetToken.expires_at < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    const user = await User.findById(passwordResetToken.user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();
    await passwordResetToken.deleteOne();
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

function generatePasswordResetToken() {
  // Generate a random 16-character alphanumeric string for the token
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 16; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    token += chars[randomIndex];
  }
  return token;
}


async function sendPasswordResetEmail(email, token) {
}

// Start lottery function
router.post('/start_lottery', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Set a start date for the lottery
    const startDate = new Date();

    // Set the start date for all users who have not played in the current lottery
    await User.update({ last_played: startDate }, { where: { last_played: null } });

    // Create a new lottery with the current start date
    const newLottery = await Lottery.create({ purchase_date: startDate });

    return res.status(200).json({ message: 'Lottery started successfully', lottery: newLottery });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong while starting the lottery' });
  }
});

// Close lottery function
router.post('/close_lottery', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Set an end date for the lottery
    const endDate = new Date();

    // Get the latest lottery and set the end date
    const latestLottery = await Lottery.findOne({ order: [['purchase_date', 'DESC']] });
    await latestLottery.update({ end_date: endDate });

    // Get all users who played in the latest lottery
    const users = await User.findAll({
      include: [
        {
          model: Lottery,
          where: { id: latestLottery.id }
        }
      ]
    });

    // Randomly select a winner from the users who played in the latest lottery
    const winner = users[Math.floor(Math.random() * users.length)];

    return res.status(200).json({ message: 'Lottery closed successfully', winner });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong while closing the lottery' });
  }
});
module.exports = router;
