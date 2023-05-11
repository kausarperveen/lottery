
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user'); // import the User model
const Lottery = require('../models/lottery'); // import the Lottery model
const PasswordResetToken = require('../models/PasswordResetToken'); // import the PasswordResetToken model
const SECRET_KEY = process.env.JWT_SECRET;

//const User=require('../models/user

async function signupValidators(body) {
  try {
    let { username, email, confirmEmail, password, confirmPassword, role } = body;

    // Check if email and confirmEmail match
    if (email !== confirmEmail) {
      throw { code: 400, error: 'Email and confirmEmail do not match.' };
    }

    // Check if password and confirmPassword match
    if (password !== confirmPassword) {
      throw { code: 401, error: 'Password and confirmPassword do not match.' };
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw { code: 201, error: 'Email already exists.' };
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      throw { code: 200, error: 'Username already exists.' };
    }

    // Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    body.password = hashedPassword

    return true;
  } catch (err) {
    throw err;
  }
}

// Function to authenticate user
async function loginValidators(email, password) {

  const user = await User.findOne({ email });
  console.log(user)
  if (!user) {
    return { error: 'Invalid email or password', status: 401 };
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return { error: 'Invalid email or password', status: 401 };
  }

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { "expiresIn": "1h" });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email
    },

  };
}

async function resetPasswordValidators(token, password, confirmPassword) {
  try {
    const passwordResetToken = await PasswordResetToken.findOne({ token });

    if (!passwordResetToken || passwordResetToken.expires_at < new Date()) {
      return { error: 'Invalid or expired token', status: 400 };
    }

    const user = await User.findById(passwordResetToken.user_id);

    if (!user) {
      return { error: 'User not found', status: 404 };
    }

    if (password !== confirmPassword) {
      return { error: 'Passwords do not match', status: 400 };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();
    await passwordResetToken.deleteOne();

    return { message: 'Password reset successfully' };
  } catch (error) {
    console.error(error);
    return { error: error.message, status: 500 };
  }
}





module.exports = {
  signupValidators,
  loginValidators,
  resetPasswordValidators
}