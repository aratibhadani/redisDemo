require('dotenv').config();
const { tokenMatch } = require("./helper_func");
var jwt = require('jsonwebtoken');
const { FORBIDDEN_STATUS, PAGE_NOT_FOUND_STATUS, UNAUTHORIZED_STATUS } = require('./enum_data');
const client = require('./redis_client');


//for check login user jwt
const loginCheck = async (req, res, next) => {
  try {

    if (!req.headers['authorization']) {
      res.status(FORBIDDEN_STATUS).json({
        message: "Token Not get"
      });
    } else {
      const token = req.headers.authorization.split(' ')[1];
      await jwt.verify(token, process.env.LOGIN_SECRET_KEY, async (err, payload) => {
        if (err) {
          const message = err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message;
          res.status(PAGE_NOT_FOUND_STATUS).json({ message: message });
        } else {
          const user = await tokenMatch(payload.id, token);
          if (user)
            next();
          else
            res.status(PAGE_NOT_FOUND_STATUS).json({ message: "you allready logout" })
        }
      });
    }
  } catch (error) {
    res.status(UNAUTHORIZED_STATUS).json({ message: error });
  }
}
const redis_middleware = async (req, res, next) => {
  try {
    console.log('start middleware')
    const redisData=await client.get('userData');
    if(!redisData){
      next()
    }else{
      console.log('=====================================redis  call =============================================')
        res.send(JSON.parse(redisData))
    }
  } catch (error) {
    console.log('middleware error--->', error)
  }
}


module.exports = { loginCheck,redis_middleware }