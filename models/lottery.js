const mongoose = require('mongoose');

const lotterySchema = new mongoose.Schema({
  lottery_number: {
    type: [Number],
    unique: true,
    required: false
  },
  purchase_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  end_time: {
    type: Date,
    default: function() {
      if (this.purchase_date) {
        return new Date(this.purchase_date.getTime() + (24 * 60 * 60 * 1000));
      } else {
        return null;
      }
    }
  },
  wallet_address: {
    type: String,
    required: true
  },
  checked_status: {
    type: Boolean,
    default: false
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  collection: 'lottery',
  timestamps: false
});
lotterySchema.index({ wallet_address: 1 });
const Lottery = mongoose.model('Lottery', lotterySchema);

module.exports = Lottery;