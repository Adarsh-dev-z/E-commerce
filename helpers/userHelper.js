const {Users} = require('../models/user')
const Product = require('../models/product')
const Cart = require('../models/cart')
const Wishlist = require('../models/wishlist')
module.exports={
    createUser:async(data)=>{
        try {
            const newUser = await Users.create(data)
            return newUser
        } catch (error) {
            console.log(error)
            
        }
    },
    findToken : async function(data){
        try {
            const token = await Users.findOne({verificationToken: data});
            return token;
        } catch (error) {
            console.log(error)
            
        }
    },findProduct:async function(data){
        try {
            const product = await Product.findOne({_id:data})
            return product;
        } catch (error) {
            console.log(error)
            
        }
    },
    findcart:async function(data){
        try {
            const cart = await Cart.findOne({user:data._id}).populate("items.product")
            return cart;
        } catch (error) {
            console.log(error)
            
        }
    },
    getwishlist: async function(userId) {
        try {
          const wishlist = await Wishlist.findOne({user: userId}).populate('products');
          return wishlist;
        } catch (error) {
          console.error('Error retrieving wishlist:', error);
          throw error;
        }
      }
    
    
    
}