const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/checkRegisterd');
const User = require('../models/user'); // import the User model
const Lottery = require('../models/lottery'); // import the Lottery model
const PasswordResetToken = require('../models/PasswordResetToken'); // import the PasswordResetToken model
/* GET users listing. */
const MAX_LOTTERY_NUMBERS = 500;
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});


router.post('/buy_lottery', authenticateToken, async (req, res) => {
  try {
    const { wallet_address, lottery_number } = req.body;
    const user_id = req.user && req.user._id;

    if (!user_id) {
      return res.status(401).send('Unauthorized');
    }

    const lotteryUser = await Lottery.findOneAndUpdate(
      { wallet_address },
      { $set: { user_id } },
      { upsert: true, new: true }
    );
    
    if (!lotteryUser) {
      return res.status(400).send('Invalid wallet address');
    }
    
    // Generate a sequence of unique lottery numbers, up to a maximum of 500
    const maxLotteryNumber = await Lottery.findOne().sort({ lottery_number: -1 }).limit(1);
    const nextLotteryNumber = (maxLotteryNumber?.lottery_number || 0) + 1;
    const numLotteryNumbers = Math.min(lottery_number, 500);
    if (numLotteryNumbers <= 0) {
      return res.status(400).send('Invalid number of lottery tickets');
    }
    const lotteryNumbers = Array.from({ length: numLotteryNumbers }, (_, i) => {
      const num = nextLotteryNumber + i;
      if (num > 500) {
        throw new Error('Cannot generate more than 500 lottery tickets');
      }
      return num;
    });

    // Create Lottery objects for the tickets being purchased
    const lotteryTickets = lotteryNumbers.map(lotteryNumber => ({
      user_id,
      lottery_number: lotteryNumber,
      purchase_date: new Date(),
      wallet_address,
    }));

    // Save the Lottery objects to the database
    await Lottery.insertMany(lotteryTickets);

    return res.status(200).send('Lottery tickets purchased successfully');
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal server error');
  }
});
router.get('/generate-random-winners', authenticateToken, async (req, res) => {
  try {
    const numWinners = 5; // Number of random lottery numbers to generate is set to 5

    // Retrieve all the users who have bought lottery tickets
    const lotteryUsers = await User.aggregate([
      { $sample: { size: numWinners } },
      { $lookup: { from: 'lottery', localField: '_id', foreignField: 'user_id', as: 'lotteries' } },
      { $project: { _id: 0, lottery_number: { $arrayElemAt: ['$lotteries.lottery_number', 0] } } }
    ]);

    res.json({ winning_users: lotteryUsers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});
    

router.get('/draw', async (req, res) => {
      try {
        const numWinners = 5; // Number of random lottery numbers to generate is set to 5
    
        // Retrieve all the users who have bought lottery tickets
        const lotteryUsers = await User.aggregate([
          { $sample: { size: numWinners } },
          { $lookup: { from: 'lottery', localField: '_id', foreignField: 'user_id', as: 'lotteries' } },
          { $project: { _id: 1, lottery_number: { $arrayElemAt: ['$lotteries.lottery_number', 0] } } }
        ]);
    
        res.json({ draw: lotteryUsers });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
      }
    });
    
    

module.exports = router;