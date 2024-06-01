const mongoose=require('mongoose');

const bannerSchema=mongoose.Schema({
    image:{
        type:String,
        required:true,
    },
    title:{
        type:String,
    }
})