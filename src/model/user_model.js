const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const sequelize = require('../config/db_conn')
const userSchema = sequelize.define("user", {
  name: {
    type: Sequelize.STRING(50)
  },
  email: {
    type: Sequelize.STRING(50),
    unique: true,
  },
  contactno: {
    type: Sequelize.STRING(50),
  },
  password: {
    type: Sequelize.STRING,
    allowNull: true
  },
  loginToken: {
    type: Sequelize.STRING(255)
  },
  forgetToken:{
    type: Sequelize.STRING(255)
  }
}, 
{
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSaltSync(saltRounds);
        user.password = bcrypt.hashSync(user.password, salt);
      }
    },
  },
  tableName: 'user'
});

module.exports = userSchema;