const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');
  function generatePasswordResetToken() {
    const token = crypto.randomBytes(16).toString('hex');
    return token;
  }
 

  async function sendPasswordResetEmail(email, token) {
    // Set your SendGrid API key
    sgMail.setApiKey('YOUR_SENDGRID_API_KEY');
  
    // Define the email content
    const msg = {
      to: email, // Recipient's email address
      from: 'your_email@example.com', // Replace with your email address
      subject: 'Password Reset', // Email subject
      text: `Click the following link to reset your password: https://example.com/reset?token=${token}` // Email body
    };
  
    try {
      // Send the email
      await sgMail.send(msg);
      console.log('Email sent');
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
  


  //async function sendPasswordResetEmail(email, token) {
  //}
  module.exports={generatePasswordResetToken,
                  sendPasswordResetEmail}