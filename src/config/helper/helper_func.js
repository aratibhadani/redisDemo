require('dotenv').config();
const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');
const userSchema = require('../../model/user_model');

const saltRounds = 10;

module.exports = {
    // create common function for check user is exists or not
    checkUserExistOrNot: async (email, t) => {
        return await userSchema.findOne({ where: { email } }, { transaction: t });
    },
    // create common function for generate token
    generateJwtToken: async (userData, secretKey, expDuration) => {
        return await jwt.sign({
            id: userData.id,
            userName: userData.name,
            email: userData.email,
        }, secretKey, {
            expiresIn: expDuration,
        });
    },
    //     // create common function for token match
    tokenMatch: async (userId, token) => {

        return await userSchema.findOne({
            where:
            {
                id: userId,
                loginToken: token,
            },
        });
    },
    // create common function for forget password token match
    forgetTokenCompare: async (token, secret) => {
        return await jwt.verify(token, secret);
    },

    // return decoded token value
    returnDecodedToken: async (req) => {
        const token = req.headers.authorization.split(' ')[1];
        return jwt.verify(token, process.env.LOGIN_SECRET_KEY);
    },
    // eslint-disable-next-line no-return-await
    returnArray: async (arrayObj) => await arrayObj.map((item) => item.id),

    // common for convert password into hash password
    passwordConvertHash: async (password) => {
        const salt = bcrypt.genSaltSync(saltRounds);
        return bcrypt.hashSync(password, salt);
    },
    // common for comparing password
    // eslint-disable-next-line no-return-await
    comparePassword: async (password, dbPassword) => await bcrypt.compare(password, dbPassword),

};
