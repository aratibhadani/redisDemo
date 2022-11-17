require('dotenv').config();
const { tokenMatch } = require("./helper_func");
var jwt = require('jsonwebtoken');
const { FORBIDDEN_STATUS, PAGE_NOT_FOUND_STATUS, UNAUTHORIZED_STATUS } = require('./enum_data');


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

module.exports = { loginCheck }