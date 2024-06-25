// const mongoose = require('mongoose')

// const addressSchema= mongoose.Schema({
//     user:{
//         type:mongoose.Schema.Types.ObjectId,
//         ref:"Users",
//         required:true
//     },
//     name:{
//         type:String,
//         required:true,
//     },
//     mobileNumber:{
//         type:Number,
//         required:true,
//     },
//     pinCode:{
//         type:Number,
//         required:true,
//     },
//     address:{
//         type:String,
//         required:true,
//     },
//     state:{
//         type:String,
//         required:true
//     },
//     city:{
//         type:String,
//         required:true,
//     }

// })

// module.exports=mongoose.model("Address",addressSchema)


const mongoose = require('mongoose')

const addressSchema = mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Users'
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
    },
    email: {
        type: String,
        required: true
    },
    telephone:{
        type:String,
        required:true
    },
    company:{
        type:String
    },
    street:{
        type:String
    },
    address:{
        type:String,
        required:true
    },
    apartment:{
        type:String,
        required:true
    },
    city:{
        type:String,
        required:true
    },
    postCode:{
        type:String,
        required:true
    },
    state:{
        type:String,
        required:true
    },
    notes:{
        type:String
    }

})

module.exports = mongoose.model("Address", addressSchema)