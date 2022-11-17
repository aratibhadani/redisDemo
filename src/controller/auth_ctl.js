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

const { emailQueue } = require('../config/processor');
const client = require('../config/helper/redis_client');
const forgetSecret = process.env.JWT_SECRET_FORGETPASSWORD;

module.exports = {

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
        return res.status(SUCCESS_STATUS).json({ message: 'User created successfully' });
      }
    } catch (error) {
      await t.rollback();
      return res.status(INTERNAL_SERVER_STATUS).json({ message: 'Internal Server Error...' });
    }
  },

  //login the user
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
    console.log(userData.password);
    console.log(await comparePassword(password, userData.password))
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
      console.log(error)
      await t.rollback();
      return res.status(INTERNAL_SERVER_STATUS).json({ message: 'Internal Server Error' });
    }
  },

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
      console.log(error)
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
      //store data in redis 
      await client.setEx('userData', 10, JSON.stringify(userData))
      
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
