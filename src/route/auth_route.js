const express = require('express');
const bodyParser = require('body-parser');
const {
  userRegistration,
  listUser,
  loginUser,
  logout,
  changePassword,
  postForgetPassword,
  getResetPassword,
  postResetPassword,
  editUser,
  deleteUser,
  sendEmailToUsers,
} = require('../controller/auth_ctl');
const { loginCheck } = require('../config/helper/middleware');

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

router.post('/registration', userRegistration);
router.post('/login', loginUser);

// route for forgot password ,make get route for better understanding
router.post('/forgot-password', postForgetPassword);

router.get('/reset-password/:token', getResetPassword);
router.post('/reset-password/:token', postResetPassword);

// change password after login
router.post('/changepwd', loginCheck, changePassword);
router.put('/edituser/:id', loginCheck, editUser);
router.delete('/deletuser/:id', loginCheck, deleteUser);
router.get('', loginCheck, listUser);
router.get('', loginCheck, editUser);

//send all user to mail for offer
router.get('/sendoffer',loginCheck,sendEmailToUsers);

router.get('/logout', loginCheck, logout);

module.exports = router;
