const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 255,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 255,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  lotteries: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Lottery',
    }
  ],
  last_played: {
    type: Date,
    default: null,
  }
});
const User = mongoose.model('User', UserSchema);

module.exports = User;
