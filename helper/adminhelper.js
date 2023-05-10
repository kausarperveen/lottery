const crypto = require('crypto');
  function generatePasswordResetToken() {
    const token = crypto.randomBytes(16).toString('hex');
    return token;
  }
  
  async function sendPasswordResetEmail(email, token) {
  }
  module.exports={generatePasswordResetToken,
                  sendPasswordResetEmail}