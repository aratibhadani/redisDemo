require('dotenv').config();
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    host: process.env.MAILER_HOST_NAME,
    port: 2525,
    auth: {
      user: process.env.MAILER_USER_NAME,
      pass: process.env.MAILER_PASSWORD
    }
  });
  
transporter.verify((error,success)=>{
    if(error){
        console.log('mail error->',error)
    }else{
        console.log('mail server running...')
    }
})
module.exports={transporter}