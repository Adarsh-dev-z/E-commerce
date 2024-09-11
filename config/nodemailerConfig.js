const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.APP_EMAIL,
      pass: process.env.APP_PASSWORD 
    }
  });
  
  function generateToken() {
    const token = crypto.randomBytes(20).toString('hex');
    const expireTime = Date.now()+ 3600000;
    return {token, expireTime}
  }

  
  module.exports = {transporter, generateToken}