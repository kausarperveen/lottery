const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/checkRegisterd');
const User = require('../models/user'); // import the User model
const Lottery = require('../models/lottery'); // import the Lottery model
const PasswordResetToken = require('../models/PasswordResetToken'); // import the PasswordResetToken model
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
}); 


router.post('/buy_lottery', authenticateToken, async (req, res) => {
  try {
    const { wallet_address, lottery_numbers } = req.body;
    const user_id = req.user && req.user.user_id;

    if (!user_id) {
      return res.status(401).send('Unauthorized');
    }

    const lotteryUser = await Lottery.findOne({ wallet_address });

    if (!lotteryUser) {
      return res.status(400).send('Invalid wallet address');
    } else if (lotteryUser.user_id !== user_id) {
      return res.status(400).send('Invalid wallet address');
    }

    // Generate a sequence of unique lottery numbers, up to a maximum of 500
    const maxLotteryNumber = await Lottery.max('lottery_number');
    const nextLotteryNumber = (maxLotteryNumber || 0) + 1;
    const numLotteryNumbers = Math.min(lottery_numbers, 500);
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
    await Lottery.bulkCreate(lotteryTickets);

    return res.status(200).send('Lottery tickets purchased successfully');
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal server error');
  }
});







router.get('/generate-random-winners', authenticateToken, async (req, res) => {
  try {
    // Retrieve all the users who have bought lottery tickets
    const lotteryUsers = await User.findAll({ include: Lottery });
    
    // Extract the lottery numbers from each user and combine them into a single array
    const allLotteryNumbers = lotteryUsers.map(user => user.Lotteries.map(lottery => lottery.lottery_number)).flat();
    
    // Shuffle the array of lottery numbers
    const shuffledLotteryNumbers = shuffleArray(allLotteryNumbers);
    
    // Select the first five numbers from the shuffled array to use as the winning numbers
    const winningNumbers = shuffledLotteryNumbers.slice(0, 5);
    
    // Find the users who have these winning numbers and send them in the response
    const winningUsers = await User.findAll({
      include: {
        model: Lottery,
        where: {
          lottery_number: winningNumbers
        }
      }
    });
    
    res.json({ winning_users: winningUsers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;