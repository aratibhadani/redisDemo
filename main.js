require('dotenv').config();

const express=require("express");
const app=express();
const port=process.env.PORT||3000;
const relationship = require("./src/model/relationship");
const router = require("./src/route/auth_route");
//index file require in main.js file
require('./src/config/processor/index'); //require queue bull processer folder in main.js file
relationship();
app.set('view engine', 'ejs');

app.use("/user",router)

app.listen(port,()=>{
    console.log("Listen to port Number :",port)
})
