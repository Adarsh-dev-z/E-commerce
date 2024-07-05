const mongoose= require("mongoose");

const userSchema =mongoose.Schema({
    username:{
        type:String,
        trim:true,
        required:true,
        minLength:[3, "minimum length is 3"],
        maxLength:[20,"maximum length is 20"],
    },
    profilePic:{
        type:String
    },
    email:{
        type:String,
        trim:true,
        required:true,
        unique:true
    },
    phone:{
        type:Number,
        trim:true,
        required:true,
        minLength:[8, "minimum length is 8"],
        maxLength:[13,"maximum length is 13"],
    },
    password:{
        type:String,
        trim:true,
        minLength:[5,"minimum length is 5"]
    },
    role:{
        type:String,
        default:"user"
    },
    status:{
        type:String,
        default:"active"
    },
    walletAmount:{
        type:Number,
        default:0
    },
    verificationToken:{
        type:String,
    },
    isVerifyed:{
        type:String,
        default:"false"
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    tokenExpires:{
        type:Date
    },
    stripeAccountId:{
        type:String
    }
},
{timestamps:true}
)

const deletedUser=mongoose.Schema({
    username:{
        type:String
    },
    email:{
        type:String,
        
    },
    status:{
        type:String,
        default:"deleted",
    },
    phone:{
        type:String,
        
    },
    address:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Address",
        
    },
    password:{
        type:String
    }

},
{timestamps:true}
);


const Users = mongoose.model("Users",userSchema)
const DeletedUser = mongoose.model("DeletedUser", deletedUser)
module.exports = { Users, DeletedUser }
