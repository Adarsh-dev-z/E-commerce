const { type } = require('jquery');
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
        enum:['pending', 'processing', 'shipped','delivered', 'canceled'],
        default:'pending',
    },
    stripeSessionId:{
        type:String
    },
    payment:{
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
    returnItems:[
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
            returnAmount:{
                type:Number,
                required:true,
            },
            success:{
                type:Boolean,
                default:false
            },
            reason:{
                type:String,
                
            },
            status:{
                type:String,
                enum:['pending', 'processing', 'refunded'],

            },
            orderID:{
                type:String
            }
        }
    ],
    totalAmount:{
        type:Number
    },
    totalPrice:{
        type:Number
    },
    discountAmount:{
        type:String,
    },
    stockUpdated:{
        type:Boolean,
        default:false
    },
    refund:{
        type:Boolean,
        default:false
    },
    deliveryExpectedDate:{
        type:Date
    },
    completeOrderReturn:{
        type:Boolean,
        default:false
    }
});

module.exports=mongoose.model("Order", orderSchema)