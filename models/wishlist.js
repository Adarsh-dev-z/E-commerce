// const mongoose=require("mongoose");
// const user = require("./user");
// const productSchema = require("./product");
// const product = require("./product");

// const wishlistSchema =mongoose.Schema({
//     user:{type:mongoose.Schema.Types.ObjectId,
//     ref:"User",
//     required:true
//     },
//     products:[{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Product',
//         required: true
//     }]
// });

// module.exports= mongoose.model("Wishlist", wishlistSchema)


const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    }]
});

module.exports = mongoose.model('Wishlist', wishlistSchema);
