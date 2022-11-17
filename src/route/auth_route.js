const express = require('express');
const bodyParser = require('body-parser');
const {
  userRegistration,
  listUser,
  loginUser,
  logout,
  editUser,
  deleteUser,
} = require('../controller/auth_ctl');
const { loginCheck, redis_middleware } = require('../config/helper/middleware');
const userSchema = require('../model/user_model');
const client = require('../config/helper/redis_client');

//connect to the redis client
(async()=>{
  await client.connect();
})();

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

router.post('/registration', userRegistration);
router.post('/login', loginUser);
router.put('/edituser/:id', loginCheck, editUser);
router.delete('/deletuser/:id', loginCheck, deleteUser);

//redis_middleware is a check the data is present or not in redis
router.get('/',loginCheck,redis_middleware, listUser);
router.get('/logout', loginCheck, logout);

module.exports = router;
