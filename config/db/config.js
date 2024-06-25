const mongoose=require("mongoose");
const db=mongoose.connection;
require('dotenv').config()
mongoose.set("strictQuery",true);
mongoose.connect(process.env.MONGO_URI,{});

db.once("open", ()=>console.log("connected to mongoose"));
db.on("error",(error)=>console.log(error));
db.on("disconnect",()=>console.log("mongoose disconnected"));

module.exports=mongoose.connection