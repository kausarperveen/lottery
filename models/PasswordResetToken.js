const mongoose = require('mongoose');
const { Schema } = mongoose;

const PasswordResetTokenSchema = new Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expires_at: {
    type: Date,
    required: true,
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

module.exports = mongoose.model('PasswordResetToken', PasswordResetTokenSchema);
