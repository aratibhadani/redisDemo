const sequelize = require("../config/db_conn");

const userSchema = require("./user_model");


const relationship = () => {
   
    sequelize.sync();
    // sequelize.sync({force: true});   
   
}
module.exports = relationship;