require('dotenv').config();

const { Op } = require('sequelize');
const userSchema = require('../model/user_model');
const {
  checkUserExistOrNot,
  returnDecodedToken,
  passwordConvertHash,
  comparePassword,
  generateJwtToken,
  forgetTokenCompare,
  returnArray,
} = require('../config/helper/helper_func');
const sequelize = require('../config/db_conn');
const {
  createUserValidation,
  loginValidation,
  changePasswordValidation,
  forgetPasswordValidation,
  changeForgetPasswordValidation,
  editUserValidation,
} = require('../config/helper/input_validation');
const { resetPasswordLink, BAD_REQUEST_STATUS, CONFLICT_STATUS, SUCCESS_STATUS, INTERNAL_SERVER_STATUS, UNAUTHORIZED_STATUS, PAGE_NOT_FOUND_STATUS } = require('../config/helper/enum_data');
const { forgetPasswordLinkSendTemplate, accountCreationTemplate } = require('../config/helper/mail/send_mail_template');

const { emailQueue } = require('../config/processor');
const forgetSecret = process.env.JWT_SECRET_FORGETPASSWORD;

module.exports = {
  //send bulk email using queue job
  sendEmailToUsers: async (req, res) => {
    try {
      const userData = await userSchema.findAll();

      userData.forEach((user, index) => {
        emailQueue.add(
          { user },
          { delay: 4000 }
        )
          .then(() => {
            if (index + 1 === userData.length) {
              res.status(SUCCESS_STATUS).json({ msg: "Mail Send to all User...." })
            }
          })
      })

    } catch (error) {
      return res.status(INTERNAL_SERVER_STATUS).json({ message: 'Internal Server Error...' });
    }
  },
  // user add
  userRegistration: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const response = createUserValidation(req.body);
      if (response.error) {
        return res.status(BAD_REQUEST_STATUS).json({ message: `${response.error.details[0].message}` });
      }
      const { name, email, contactno, password } = req.body;
      // check id exists or not
      const checkEmail = await checkUserExistOrNot(email, t);
      if (checkEmail) {
        return res.status(CONFLICT_STATUS).json({ message: 'Email already exists' });
      }
      const user = await userSchema.create({
        name, email, contactno, password,
      }, { transaction: t });
      await t.commit();
      if (user) {
        await accountCreationTemplate(name, email, password);
        return res.status(SUCCESS_STATUS).json({ message: 'User created successfully' });
      }
    } catch (error) {
      await t.rollback();
      return res.status(INTERNAL_SERVER_STATUS).json({ message: 'Internal Server Error...' });
    }
  },
  // eslint-disable-next-line consistent-return
  editUser: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const userId = req.params.id;
      const response = editUserValidation(req.body);
      if (response.error) {
        return res.status(BAD_REQUEST_STATUS).json({ message: `${response.error.details[0].message}` });
      }
      const { name, email, contactno } = req.body;
      // check email exists or not
      const checkUser = await userSchema.findOne({ where: { id: userId } });
      if (!checkUser) {
        return res.status(CONFLICT_STATUS).json({ message: 'User Not Present' });
      }
      // eslint-disable-next-line max-len
      const user = await userSchema.update({ name, email, contactno }, { where: { id: userId } }, { transaction: t });
      await t.commit();
      if (user) {
        return res.status(SUCCESS_STATUS).json({ message: 'User updated successfully' });
      }
    } catch (error) {
      await t.rollback();
      return res.status(INTERNAL_SERVER_STATUS).json({ message: 'Internal Server Error...' });
    }
  },
 
  deleteUser: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const userId = req.params.id;
      // check id exists or not
      const checkUser = await userSchema.findOne({ where: { id: userId } });
      if (!checkUser) {
        return res.status(CONFLICT_STATUS).json({ message: 'User Not Present' });
      }

     
      const user = await userSchema.destroy({ where: { id: userId } }, { transaction: t });

      if (user === 1) {
        return res.status(SUCCESS_STATUS).json({ message: 'User Deleted successfully' });
      }

      await t.commit();
    } catch (error) {
      await t.rollback();
      return res.status(INTERNAL_SERVER_STATUS).json({ message: 'Internal Server Error...' });
    }
  },
  // eslint-disable-next-line consistent-return
  loginUser: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const response = loginValidation(req.body);
      if (response.error) {
        return res.status(BAD_REQUEST_STATUS).json({ message: `${response.error.details[0].message}` });
      }
      const { email, password } = req.body;
      const userData = await checkUserExistOrNot(email, t);

      if (!userData) {
        return res.status(BAD_REQUEST_STATUS).json({ message: 'User Not Found' });
      }
      if (await comparePassword(password, userData.password)) {
        const token = await generateJwtToken(userData, process.env.LOGIN_SECRET_KEY, '1h');
        await userSchema.update(
          { loginToken: token },
          { where: { id: userData.id } },
          { transaction: t },
        );
        await t.commit();

        res.status(SUCCESS_STATUS).json({
          token,
          message: 'login successfully',
        });
      } else {
        return res.status(UNAUTHORIZED_STATUS).json({ message: 'Unauthorized User' });
      }

    } catch (error) {
      await t.rollback();
      return res.status(INTERNAL_SERVER_STATUS).json({ message: 'Internal Server Error' });
    }
  },
  // eslint-disable-next-line consistent-return
  listUser: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      // eslint-disable-next-line radix
      const offset = parseInt(req.query?.offset) || null;
      // eslint-disable-next-line radix
      const limit = parseInt(req.query?.limit) || null;
      const search = req.query?.search || '';
      const userData = await userSchema.findAndCountAll(
        {
          attributes: ['id', 'name', 'email'],
          limit,
          offset,
          where: {
            [Op.and]: [
              {
                [Op.or]: [
                  {
                    name: {
                      [Op.like]: `%${search}%`,
                    },
                  },
                  {
                    email: {
                      [Op.like]: `%${search}%`,
                    },
                  },
                ],
              },
            ],

          },
        },
        { transaction: t },
      );
      if (userData.count === 0) {
        return res.status(PAGE_NOT_FOUND_STATUS).json({ message: 'no any User Present in DB' });
      }
      res.status(SUCCESS_STATUS).json({
        data: userData.rows,
        totalUser: userData.count,
        message: 'Data get successfully',
      });

      await t.commit();
    } catch (error) {
      await t.rollback();
      return res.status(INTERNAL_SERVER_STATUS).json({ message: 'Internal Server Error' });
    }
  },
  // eslint-disable-next-line consistent-return
  changePassword: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const response = changePasswordValidation(req.body);
      if (response.error) {
        res.status(BAD_REQUEST_STATUS).json({
          message: `${response.error.details[0].message}`,
        });
      } else {
        const { oldPassword, newPassword } = req.body;
        const loginUser = await returnDecodedToken(req);
        const userData = await checkUserExistOrNot(loginUser.email, t);
        if (await comparePassword(oldPassword, userData.password)) {
          const hashPassword = await passwordConvertHash(newPassword);
          const userUpdate = await userSchema.update({ password: hashPassword }, {
            where: {
              id: userData.id,
              email: userData.email,
            },
          }, { transaction: t });
          if (userUpdate === 1) {
            res.status(SUCCESS_STATUS).json({ message: 'Password change' });
          }
          t.commit();
        } else {
          return res.status(UNAUTHORIZED_STATUS).json({ message: 'Unauthorized User' });
        }
      }
    } catch (error) {
      t.rollback();
      return res.status(INTERNAL_SERVER_STATUS).json({ message: 'Internal Server Error' });
    }
  },
  postForgetPassword: async (req, res) => {
    const t = await sequelize.transaction();

    try {
      const response = forgetPasswordValidation(req.body);
      if (response.error) {
        return res.status(BAD_REQUEST_STATUS).json({ message: `${response.error.details[0].message}` });
      }
      const { email } = req.body;
      const userData = await checkUserExistOrNot(email, t);
      if (userData) {
        const token = await generateJwtToken(userData, forgetSecret, '15m');
        // token store in db
        await userSchema.update({
          forgetToken: token,
        }, {
          where: { email, id: userData.id },
        }, { transaction: t });
        t.commit();
        await forgetPasswordLinkSendTemplate(email, `${resetPasswordLink}/${token}`);
        return res.status(SUCCESS_STATUS).json({
          message: 'link send successfully check In mail',
        });
      }
      return res.status(PAGE_NOT_FOUND_STATUS).json({ message: 'User Not Register' });
    } catch (error) {
      t.rollback();
      return res.status(INTERNAL_SERVER_STATUS).json({ message: 'Internal Server Error...' });
    }
  },
  // eslint-disable-next-line consistent-return
  getResetPassword: async (req, res) => {
    const t = await sequelize.transaction();

    try {
      const { token } = req.params;
      // url token
      const decodedtoken = await forgetTokenCompare(token, forgetSecret);

      const userData = await checkUserExistOrNot(decodedtoken.email, t);

      if (userData.forgetToken) {
        res.render('reset-password', { email: userData.email });
      } else {
        res.status(BAD_REQUEST_STATUS).send({ message: 'link is expired' });
      }
      t.commit();
    } catch (error) {
      t.rollback();
      return res.status(INTERNAL_SERVER_STATUS).json({ message: 'Internal Server Error...' });
    }
  },
  // eslint-disable-next-line consistent-return
  postResetPassword: async (req, res) => {
    const t = await sequelize.transaction();

    try {
      const response = changeForgetPasswordValidation(req.body);
      if (response.error) {
        return res.status(BAD_REQUEST_STATUS).json({ message: `${response.error.details[0].message}` });
      }
      const { token } = req.params;
      const { password } = req.body;
      // url token check
      const decodedtoken = await forgetTokenCompare(token, forgetSecret);
      const userData = await checkUserExistOrNot(decodedtoken.email, t);

      if (!userData) {
        return res.status(PAGE_NOT_FOUND_STATUS).json({ message: 'user not exits' });
      }
      if (userData.forgetToken === '') {
        return res.status(BAD_REQUEST_STATUS).json({ message: 'Link expired' });
      }
      // db token check
      const dbDecodeToken = await forgetTokenCompare(userData.forgetToken, forgetSecret);

      if (decodedtoken.id === dbDecodeToken.id || decodedtoken.email === dbDecodeToken.email) {
        const hashpassword = await passwordConvertHash(password);
        const updateData = await userSchema.update({
          password: hashpassword,
          forgetToken: '',
        }, {
          where: {
            email: dbDecodeToken.email, id: dbDecodeToken.id,
          },
        });
        if (updateData === 1) {
          return res.status(SUCCESS_STATUS).json({ message: 'password Updated successfully' });
        }
      } else {
        res.status(BAD_REQUEST_STATUS).send({ message: 'link is expired' });
      }
    } catch (error) {
      t.rollback();
      return res.status(INTERNAL_SERVER_STATUS).json({ message: 'Internal Server Error...' });
    }
  },
  // eslint-disable-next-line consistent-return
  logout: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const userData = await returnDecodedToken(req);
      const data = await userSchema.update({
        loginToken: '',
      }, { where: { id: userData.id, email: userData.email } });
      if (data[0] === 1) {
        res.status(SUCCESS_STATUS).json({ message: 'logout successfully' });
      }
      await t.commit();
    } catch (err) {
      await t.rollback();
      return res.status(INTERNAL_SERVER_STATUS).json({ message: 'Internal Server Error' });
    }
  },
};
