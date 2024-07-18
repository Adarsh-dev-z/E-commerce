const mongoose= require("mongoose")
const user = require("./user")

const guestCartSchema= mongoose.Schema({
    guestCartId:{
        type:String,
        required:true
    },
    items:[
        {
            product:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Product",
                required:true,
            },
            quantity:{
                type:Number,
                required :true,
                default:1
            },
            price:{
                type:Number,
                required:true,

            },
            totalPrice:{
                type:Number,
                required:true
            }
        },
        {timestamps:true}
    ]
    
})

module.exports=mongoose.model("guestCart",guestCartSchema)