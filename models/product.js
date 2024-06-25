const mongoose=require('mongoose')

const productSchema = mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    productImage:[
        {
            type:String,
            required:false,
        }]
    ,
    brand:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true,
        trim:true
    },
    category:{
        type:String,
        required:true
    },
    description:{
        type:String,
        default:'Enjoy everyday comfort with our sleek, breathable sneakers. Featuring cushioned insoles and durable outsoles, these sneakers provide excellent support and traction for any casual outing. Perfect for style and functionality.'
    },
    stock:{
        type:Number,
        default:1
    },
    expireDate:{
        type:Date,
        required:true
    },
    isOutOfStock:{
        type:Boolean,
        default:false
    }

},
{timestamps:true}
);

module.exports=mongoose.model("Product", productSchema )
