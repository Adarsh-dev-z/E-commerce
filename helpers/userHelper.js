const {Users} = require('../models/user')
const Product = require('../models/product')
const Cart = require('../models/cart')
const Wishlist = require('../models/wishlist')
const Reviews = require('../models/review')
const Address = require('../models/address')
const Banner = require('../models/banner')
const Coupon = require('../models/coupon')
const { getAddresses, removeAddress, editAddress } = require('../controller/userController')
const { token } = require('morgan')
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
    findUser:async(userId)=>{
      try{
        const user = await Users.findById({_id:userId})
        return user;
      }
      catch(err){

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
    },
    findProductReviews: async function (productId) {
        try {
          const reviews = await Reviews.find({ product: productId }).populate('user');
          return reviews;
        } catch (error) {
          console.log(error);
        }
      },
      findRelatedProducts: async function (product) {
        try {
          const relatedProducts = await Product.find({ category: product.category }).limit(5);
          return relatedProducts;
        } catch (error) {
          console.log(error);
        }
      },
      findProductsByPriceRange: async function (minPrice, maxPrice) {
        try {
          const parsedMinPrice = parseInt(minPrice);
          const parsedMaxPrice = parseInt(maxPrice);
          const products = await Product.find({
            price: { $gte: parsedMinPrice, $lte: parsedMaxPrice },
          });
          return products;
        } catch (error) {
          console.log(error);
        }
      },
      findProductsByCategory: async function (category) {
        try {
          const products = await Product.find({ category });
          return products;
        } catch (error) {
          console.log(error);
        }
      },
      findCartBySessionUserId: async function (userId) {
        try {
          const cart = await Cart.findOne({ user: userId }).populate('items.product');
          return cart;
        } catch (error) {
          console.log(error);
        }
      },
      findProductsByIds: async (productIds) => {
        try {
            const products = await Product.find({ _id: { $in: productIds } });
            return products;
        } catch (error) {
            console.log(error);
        }
    },
    findMainBanner: async () => {
        try {
            const mainBanner = await Banner.find({ title: 'banner' });
            return mainBanner;
        } catch (error) {
            console.log(error);
        }
    },

    findSquareBanner: async () => {
        try {
            const squareBanner = await Banner.find({ title: 'square banner' });
            return squareBanner;
        } catch (error) {
            console.log(error);
        }
    },

    findRecentProducts: async (limit) => {
        try {
            const products = await Product.find().sort({ createdAt: -1 }).limit(limit);
            return products;
        } catch (error) {
            console.log(error);
        }
    },

    ProductsByCategory: async (category, limit) => {
        try {
            const products = await Product.find({ category }).limit(limit);
            return products;
        } catch (error) {
            console.log(error);
        }
    },

    findLimitedProducts: async (limit) => {
        try {
            const products = await Product.find().limit(limit);
            return products;
        } catch (error) {
            console.log(error);
        }
    },
    findProductsInCart: async(productIds)=>{
      try{
        const productsInCart = await Product.find({ _id: { $in: productIds } });
        return productsInCart;
      }catch(err){
        
      }
    },

    findOrderPopulateProduct:async(userId)=>{
      try{
        const order = await Order.find({user:userId}).populate('items.product')
        return order;
      }catch(err){

      }
    },
    awaitingDeliveryOrders:async(userId)=>{
      try{
        const awaitingDeliveryOrders = await Order.countDocuments({
          user: userId,
          orderStatus: { $nin: ["delivered", "canceled"] }
      });
      return awaitingDeliveryOrders
      }
      catch(err){

      }
    },
    returnOrderItems:async(userId)=>{
      try{
        const returnOrderItems = await Order.find({user:userId}).populate('returnItems.product')
        return returnOrderItems
      }
      catch(err){
        console.log(err)
      }
    },
    getAddresses:async(userId)=>{
      try{
        const address = await Address.find({user:userId}).populate('user')
        return address
      }
      catch(err){
        console.log(err)
      }
    },
    findWishlist:async(userId)=>{
      try{
        const wishlist = await Wishlist.findOne({user:userId}).populate('products')
        return wishlist
      }
      catch(err){
        console.log(err)
      }
    }, 
    findUserByEmail: async (email) => {
        try {
            const user = await Users.findOne({ email });
            return user;
        } catch (error) {
            console.log(error);
        }
    },
    findRoleUser: async (email) => {
        try {
          const user = await Users.findOne({ email: email, role: 'user' });
          return user;
        } catch (error) {
            console.log(error);
        }

      },
      findRoleAdmin:async(email)=>{
        try{
          const admin = await Users.findOne({ email: email, role: 'admin' });
          return admin;
        }catch(error){
          console.log(error);
        }
      },
      getWishlist: async (userId) => {
        try {
          const wishlist = await Wishlist.findOne({ user: userId })
          return wishlist;
        } catch (error) {
          console.log(error);
        }
      },
      updateWishlist: async(userId, productId)=>{
        try{
          const updateWishlist = await Wishlist.findOneAndUpdate({user: userId}, {$pull:{products: productId}},
            {new: true}
        )
        return updateWishlist;
        }catch(err){

        }
      },
      removeFromCart: async(userId, productId)=>{
        try{

        
        const result = await Cart.findOneAndUpdate(
          { user: userId },
          { $pull: { items: { product: productId } } },
          { new: true }
      );
      return result
      }catch(err){

      }
    },
    clearCart: async(userId)=>{
      try{
        const cartClear = await Cart.findOneAndUpdate({user:userId}, {$set:{items:[]}},{new:true})
        return cartClear;
      }catch(err){

      }
    },
    findAddresses:async(userId)=>{
      try{
        const address = await Address.find({user:userId}).lean()
        return address
      }
      catch(err){
        console.log(err)
      }
    },
    getCart: async (userId) => {
      try {
        const cart = await Cart.findOne({ user: userId })
        .populate('items.product')
        .lean();
         return cart;
      } catch (error) {
        console.log(error);
      }
    },
    findCouponBasedOnPrice: async(cartTotal)=>{
      try{

        const coupon = await Coupon.find({
          minPriceRange: { $lt: cartTotal },
          maxPriceRange: { $gt: cartTotal }
        });
        return coupon
      }
      catch(err){

      }
    },
    getAddressById: async (addressId) => {
      try {
        const address = await Address.findById(addressId).lean();
        return address;
      } catch (error) {
        console.log(error);
      }
    },
    findProductById: async(productId)=>{
      try{
        const product = await Product.findById(productId);
        return product;
      }
      catch(err){

      }
    },
    findCouponByCode: async(couponCode)=>{
      try{
        const coupon = await Coupon.findOne({ code: couponCode })
        return coupon;
      }
      catch(err){

      }
    },
    removeAddress: async(addressId)=>{
      try{
        const address = await Address.findByIdAndDelete(addressId);
        return address;
      }
      catch(err){

      }
    },
    findUserByToken: async(token)=>{
      try{
        const user = await Users.findOne({verificationToken:token});
        return user;
      }
      catch(err){
        
      }
    },

    updateAddress:async({addressId}, data)=>{
      try{
        const updatedAddress = await Address.findOneAndUpdate({_id:addressId},{
          data
  },{ new: true })

  return updatedAddress;
      }
      catch(err){

      }
    },

    addAddress:async(data)=>{
      try{
        const newAddress = await Address.create({
          data
      })
      return newAddress
      }
      catch(err){

      }
    },

    updateUserPassword: async({email, hashedPassword})=>{
      try{
        const user = await Users.findOneAndUpdate({email:email}, {
          password: hashedPassword
        }, {new: true});
        return user;
      }
      catch(err){

      }
    },

    searchProduct:async(keyword)=>{
      try{
        const product = await Product.find({name:{$regex:new RegExp(keyword,'i')}}).lean();
        return product
      }
      catch(err){

      }
    },

    updateUserDetails:async({userId, updateData})=>{
      try{
        const updatedUser = await Users.findByIdAndUpdate(userId, updateData, { new: true });
        return updatedUser;
      }
      catch(err){

      }
    },

    findOrderWithOrderId:async(orderId)=>{
      try{
        const order = await Order.findById(orderId).populate('items.product');
        return order;
      }
      catch(err){

      }
    },

    
    createReview:async({userId, user, product, rating, comment, title, author})=>{
      try{
        const review = await Reviews.create({
          product,
          user: userId,
          userEmail: user,
          rating,
          comment,
          title,
          author
        });
        return review
      }
      catch(err){

      }
    },

    
    getReviews:async(productId)=>{
      try{
        const reviews = await Reviews.find({product:productId}).populate('product');
        return reviews;
      }
      catch(err){
        throw err;
      }
    },

    
    getCartCount:async(userId)=>{
      try{
        const cart = await Cart.findOne({user:userId});
        return cart
      }
      catch(err){
        throw err;
      }
    },

    
    findExistingAddress:async(userId,firstname,lastname,email,telephone,company,address,apartment,city,state,postcode)=>{
      try{
        const existingAddress = await Address.findOne({
          user: userId,
          firstName: firstname,
          lastName: lastname,
          email: email,
          telephone: telephone,
          company: company,
          address: address,
          apartment: apartment,
          city: city,
          state: state,
          postCode: postcode,
        });
        return existingAddress;
      }
      catch(err){

      }
    },
    
    
    getOrderDetailsById:async(orderId)=>{
      try{
        const order = await Order.findOne({_id:orderId}).populate('address').populate('items.product');
        return order;
      }
      catch(err){

      }
    },


}