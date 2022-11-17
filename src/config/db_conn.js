require('dotenv').config();
const { Sequelize } = require('sequelize');

const dbName=process.env.DB_NAME;
const hostName=process.env.DB_HOST_NAME;
const username=process.env.DB_USER_NAME;
const password=process.env.DB_PASSWORD;
const sequelize = new Sequelize(dbName, username, password, {
    host: hostName,
    dialect: 'mysql'
  });


  try {
     sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
  
  module.exports=sequelize;