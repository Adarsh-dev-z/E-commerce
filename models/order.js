const mongoose= require('mongoose');


const orderSchema= mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Users',
        required:true,
    },
    orderID:{
        type:String,
    },
    address:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Address',
        required:true
    },
    datePlaced:{
        type:Date,
        default:Date.now
    },
    orderStatus:{
        type:String,
        enum:['pending', 'processing', 'shipped','delivered', 'cancelled'],
        default:'pending',
    },
    stripeSessionId:{
        type:String
    },
    payment:{
        type:String
    },
    couponDiscount:{
        type:String
    },
    items:[
        {
            product:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'Product',
                required:true,
            },
            quantity:{
                type:Number,
                required:true,
            },
            price:{
                type:Number,
                required:true,
            }
        }
    ],
    totalPrice:{
        type:String
    },
    discountAmount:{
        type:String,
    },
    stockUpdated:{
        type:Boolean,
        default:false
    }
});

module.exports=mongoose.model("Order", orderSchema)