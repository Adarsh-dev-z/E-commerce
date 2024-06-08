const mongoose=require('mongoose');


const couponSchema=mongoose.Schema({
    code:{
        type:String,
        required:true,
        unique:true,
        trim:true,
    },
    discount:{
        type:Number,
        required:true,
    },
    minPriceRange:{
        type:Number,
        required:true
    },
    maxPriceRange:{
        type:Number,
        required:true
    },
    usageCount:{
        type:Number
    },
    expireDate:{
        type:Date,
        required:true,
    },
    
})

module.exports = mongoose.model('Coupon', couponSchema)