require('dotenv').config();

const { Op } = require('sequelize');
const userSchema = require('../model/user_model');
const {
  checkUserExistOrNot,
  returnDecodedToken,

  comparePassword,
  generateJwtToken,
  returnArray,
} = require('../config/helper/helper_func');
const sequelize = require('../config/db_conn');
const {
  createUserValidation,
  loginValidation,
  editUserValidation,
} = require('../config/helper/input_validation');
var jwt = require('jsonwebtoken');

const { BAD_REQUEST_STATUS, CONFLICT_STATUS, SUCCESS_STATUS, INTERNAL_SERVER_STATUS, UNAUTHORIZED_STATUS, PAGE_NOT_FOUND_STATUS, FORBIDDEN_STATUS } = require('../config/helper/enum_data');

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
      // check user exists or not
      checkUserExistOrNot(email, t).then((checkEmail) => {
        if (checkEmail) {
          return res.status(CONFLICT_STATUS).json({ message: 'Email already exists' });
        }
        //create new user
        userSchema.create({
          name, email, contactno, password,
        }, { transaction: t }).then(async (user) => {
          await t.commit();
          if (user) {
            return res.status(SUCCESS_STATUS).json({ message: 'User created successfully' });
          }
        });
      });
    } catch (error) {
      await t.rollback();
      return res.status(INTERNAL_SERVER_STATUS).json({ message: 'Internal Server Error...' });
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
      userSchema.findOne({ where: { id: userId } }).then((checkUser) => {
        if (!checkUser) {
          return res.status(CONFLICT_STATUS).json({ message: 'User Not Present' });
        }
        userSchema.update(
          { name, email, contactno },
          { where: { id: userId } },
          { transaction: t })
          .then(async (user) => {
            await t.commit();
            if (user) {
              return res.status(SUCCESS_STATUS).json({ message: 'User updated successfully' });
            }
          });
      });
    } catch (error) {
      await t.rollback();
      return res.status(INTERNAL_SERVER_STATUS).json({ message: 'Internal Server Error...' });
    }
  },
  getProfile: async (req, res) => {
    return res.status(SUCCESS_STATUS).json({
      message: "login user Data",
      data: req.user,
      error: false
    })
  },
  deleteUser: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const userId = req.params.id;
      // check id exists or not
      userSchema.findOne({ where: { id: userId } }).then((checkUser) => {
        if (!checkUser) {
          return res.status(CONFLICT_STATUS).json({ message: 'User Not Present' });
        }
        //delete specific user
        userSchema.destroy({ where: { id: userId } }, { transaction: t }).then(async (user) => {
          if (user === 1) {
            return res.status(SUCCESS_STATUS).json({ message: 'User Deleted successfully' });
          }
          await t.commit();
        });

      });
    } catch (error) {
      await t.rollback();
      return res.status(INTERNAL_SERVER_STATUS).json({ message: 'Internal Server Error...' });
    }
  },
  //login user Api
  loginUser: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const response = loginValidation(req.body);
      if (response.error) {
        return res.status(BAD_REQUEST_STATUS).json({ message: `${response.error.details[0].message}` });
      }
      const { email, password } = req.body;

      //check user is present or not in database
      checkUserExistOrNot(email, t).then(async (userData) => {
        if (!userData) {
          return res.status(BAD_REQUEST_STATUS).json({ message: 'User Not Found' });
        }
        if (await comparePassword(password, userData.password)) {
          const access_token = await generateJwtToken(userData, process.env.LOGIN_SECRET_KEY, '20s');
          const refresh_token = await generateJwtToken(userData, process.env.REFRESH_TOKEN_SECRET_KEY, '24d');

          //update the databse of particular user :change logintoken column
          userSchema.update(
            { loginToken: access_token },
            { where: { id: userData.id } },
            { transaction: t },
          ).then(async () => {
            await t.commit();
            res.status(SUCCESS_STATUS).json({
              accessToken: access_token,
              refreshToken: refresh_token,
              message: 'login successfully',
            });
          });
        } else {
          return res.status(UNAUTHORIZED_STATUS).json({ message: 'Unauthorized User' });
        }
      });
    } catch (error) {
      await t.rollback();
      return res.status(INTERNAL_SERVER_STATUS).json({ message: 'Internal Server Error' });
    }
  },
  //listing user api
  listUser: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const offset = parseInt(req.query?.offset) || null;
      // eslint-disable-next-line radix
      const limit = parseInt(req.query?.limit) || null;
      const search = req.query?.search || '';
      userSchema.findAndCountAll({
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
      ).then(async (userData) => {
        if (userData.count === 0) {
          return res.status(PAGE_NOT_FOUND_STATUS).json({ message: 'no any User Present in DB' });
        }
        res.status(SUCCESS_STATUS).json({
          data: userData.rows,
          totalUser: userData.count,
          message: 'Data get successfully',
        });

        await t.commit();
      });

    } catch (error) {
      await t.rollback();
      return res.status(INTERNAL_SERVER_STATUS).json({ message: 'Internal Server Error' });
    }
  },
  accessTokenGenerate: async (req, res) => {
    const refreshToken = req.body.token;
    const t = await sequelize.transaction();

    if (!refreshToken) {
      return res.status(FORBIDDEN_STATUS).json({
        message: "User not authenticated.",
        error: true
      })
    }
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET_KEY, async (err, user) => {
      if (!err) {
        //generate access token and return it
        const access_token = await generateJwtToken(user, process.env.LOGIN_SECRET_KEY, '20s');
        //update the databse of particular user :change logintoken column
        userSchema.update(
          { loginToken: access_token },
          { where: { id: user.id } },
          { transaction: t },
        ).then(async () => {
          await t.commit();
          res.status(SUCCESS_STATUS).json({
            accessToken: access_token,
            message: 'login successfully',
          });
        });
      } else {

      }
    })
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
