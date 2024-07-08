
var express = require('express');
const { getLogin, getProduct, getShop, getAbout, getBlog, 
  getCart, getCheckout, getCollection, getComingSoon, getContact, 
  getHome, getRegister, getWishlist, redirectHome, callbackUrl, postRegister, 
  getUserProfile, logOut, userLogin, userRegister, postLogin, updateCartQuantity, 
  handleVerification, postAddToWishlist, GetRemoveWishlist, postAddToCart, postRemoveCart, 
  getClearCart, getProductCheckout, getOrderSuccess, postApplyCoupon, postRemoveCoupon, 
  createCheckoutSession, editAddress, postAddAddress, removeAddress, getForgotpassword, 
  postResetPassLink, resetPassword, getUpdatePass, postUpdatePass, getSearch, 
  changeAccountDetails, 
  checkoutRazorpay,
  handleRazorpaySuccess,
  getShopByCategory,
  getCancelOrder,
  returnItems,
  returnEntireOrder,
  postReview,
  getReviews,
  createWithdrawl,
  cartCount} = require('../controller/userController');
var router = express.Router();
const passport=require("passport");
const { AuthCheck, userAuthCheck } = require('../middlewares/userAuthentication');
const crypto=require('crypto')
const nodemailer = require('nodemailer')
const bcrypt =require('bcrypt')
const { Users: User, Users } = require("../models/user");
const mongoose = require('mongoose');
const Wishlist = require('../models/wishlist')
const Cart = require('../models/cart')
const Product =require('../models/product')
const Order = require('../models/order')
const Review=require('../models/review')
const Address= require('../models/address')
const Razorpay = require('razorpay')
require('dotenv').config()
router.get('/login', getLogin)
router.get('/product', getProduct)
router.get('/shop', getShop)
router.get('/about', getAbout)
router.get("/blog", getBlog)
router.get('/checkout',userAuthCheck, getCheckout)
router.get('/collection', getCollection)
router.get('/coming-soon', getComingSoon)
router.get('/contact',userAuthCheck, getContact)
router.get('/home', getHome)
// router.get('/home/:username', getHome)
router.get('/wishlist',userAuthCheck, getWishlist)
router.get('/', redirectHome)

// router.get('/orders/:id', userAuthCheck, async (req, res) => {
//   const userId = req.user._id;
//   const orderId = req.params.id;

//   const order = await Order.find({ _id:orderId }).populate('items.product').lean()
  
 
// console.log('my order',order)
//   res.render('user/orders', { Order:order });
// }); 
router.get('/cancel-order/:id', userAuthCheck, getCancelOrder);

  
router.get('/register', getRegister);


router.post('/register', userRegister, postRegister);
router.get('/verify', handleVerification);
router.post('/login', postLogin, userLogin)

router.get("/logout", logOut)
router.get('/order-success', (req, res) => {
  setCacheControlHeaders(res);

  res.render('user/order-success');
})
router.get('/razorpay-order-success', (req, res) => { 
     setCacheControlHeaders(res);

  res.render('user/order-success');
})

router.post('/add-to-wishlist', userAuthCheck, postAddToWishlist);


router.get('/remove-wishlist', userAuthCheck, GetRemoveWishlist)


router.get('/cart',userAuthCheck, getCart)


 
router.post('/add-to-cart/:id', userAuthCheck, postAddToCart);
  

router.post('/cart/update-quantity', userAuthCheck, updateCartQuantity)


router.post('/remove-from-cart/:id', userAuthCheck, postRemoveCart);


router.get('/clear-cart', userAuthCheck, getClearCart)



const Coupon = require('../models/coupon');
const { setCacheControlHeaders } = require('../utils/cachClear');
// const { default: items } = require('razorpay/dist/types/items');
router.get('/product-checkout', userAuthCheck, getProductCheckout)

router.get('/userOrder-success', userAuthCheck, getOrderSuccess)

router.post('/apply-coupon', userAuthCheck, postApplyCoupon);

router.post('/remove-coupon', userAuthCheck, postRemoveCoupon);


router.post('/create-checkout-session', userAuthCheck, createCheckoutSession);

// ------------------------------------PAYPAL--------------------------------------------------------------


// ---------------------------------------PAYPAL-------------------------------------------------------------------
router.get('/auth/google',
passport.authenticate('google', {scope:['profile', 'email'], prompt:'select_account'}));

router.get("/auth/google/callback",
passport.authenticate('google', {failureRedirect:'/'}),
 callbackUrl);




 router.get("/userprofile", userAuthCheck, getUserProfile)

router.post('/edit-address/:id', userAuthCheck, editAddress)

router.post('/add-address', userAuthCheck, postAddAddress)

router.get('/remove-address/:id', userAuthCheck, removeAddress);



router.get('/forgot-password', getForgotpassword)

function generateToken() {
    const token = crypto.randomBytes(20).toString('hex');
    const expireTime = Date.now()+ 3600000;
    return {token, expireTime}
  }


router.post('/reset-link', postResetPassLink)

router.get('/resetpass', resetPassword);

  router.get('/update-password', getUpdatePass)

  router.post('/update-password', postUpdatePass)


  router.get('/search-product', getSearch)


  router.post('/change-account-details', userAuthCheck, changeAccountDetails)
  
router.post('/razorpay-checkout', userAuthCheck, checkoutRazorpay);

router.post('/razorpay-success', userAuthCheck, handleRazorpaySuccess); 


router.get('/view-order', async (req, res) => {
  const orderId = req.query.id;
  if (!orderId) {
    return res.status(400).send('Missing required query parameters');
  }

  const order = await Order.findOne({ _id: orderId }).populate('items.product');

  if (!order) {
    return res.status(404).send('Order not found');
  }

  const itemsWithMaxQuantityReached = order.items.map(item => {
    const totalQuantity = item.quantity;
    const totalReturnQuantity = order.returnItems
      .filter(returnItem => returnItem.product.toString() === item.product._id.toString())
      .reduce((acc, returnItem) => acc + returnItem.quantity, 0);
    return {
      ...item.toObject(),
      maxQuantityReached: totalReturnQuantity >= totalQuantity
    };
  });

  res.render('user/view-order', { order: { ...order.toObject(), items: itemsWithMaxQuantityReached }, orderId });
});



router.get('/return-items', userAuthCheck, returnItems);

router.get('/return-entire-order', userAuthCheck, returnEntireOrder);




router.get('/shopby-category', userAuthCheck, getShopByCategory)


router.post('/reviews',userAuthCheck, postReview);

router.get('/reviews/product/:productId', getReviews);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});


-
router.post('/create-withdrawal-order', userAuthCheck, createWithdrawl);

router.post('/verify-withdrawal', userAuthCheck, );

router.get('/cart-count', userAuthCheck, cartCount)






module.exports = router;

