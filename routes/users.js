
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
  cartCount,
  viewOrder,
  walletCheckout,
  renderOrderSuccess,
  renderRazorpayOrderSuccess,
  walletOrderSuccess,
  miniCart} = require('../controller/userController');
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
const Coupon = require('../models/coupon');
const { setCacheControlHeaders } = require('../utils/cachClear');
const GuestCart = require('../models/guesCart')
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
router.get('/wishlist',userAuthCheck, getWishlist)
router.get('/', redirectHome)
router.get('/cancel-order/:id', userAuthCheck, getCancelOrder);
router.get('/register', getRegister);
router.post('/register', userRegister, postRegister);
router.get('/verify', handleVerification);
router.post('/login', postLogin, userLogin)
router.get("/logout", logOut)
router.get('/order-success', renderOrderSuccess)
router.get('/razorpay-order-success', renderRazorpayOrderSuccess)
router.post('/add-to-wishlist', userAuthCheck, postAddToWishlist);
router.get('/remove-wishlist', userAuthCheck, GetRemoveWishlist)
router.get('/cart', getCart)
router.post('/add-to-cart', postAddToCart);
router.post('/guest-cart', (req, res) => {
    const guestCart = req.body.guestCart || [];
    req.session.guestCartItems = guestCart; 
    console.log(req.session.guestCartItems,'rsg')
    res.json({ success: true });
});
router.post('/cart/update-quantity', updateCartQuantity)
router.post('/remove-from-cart/:id', postRemoveCart);
router.get('/clear-cart', userAuthCheck,getClearCart)
router.get('/product-checkout', userAuthCheck, getProductCheckout)
router.get('/userOrder-success', userAuthCheck, getOrderSuccess)
router.post('/apply-coupon', userAuthCheck, postApplyCoupon);
router.post('/remove-coupon', userAuthCheck, postRemoveCoupon);
router.post('/create-checkout-session', userAuthCheck, createCheckoutSession);
router.get("/userprofile", userAuthCheck, getUserProfile)
router.post('/edit-address/:id', userAuthCheck, editAddress)
router.post('/add-address', userAuthCheck, postAddAddress)
router.get('/remove-address/:id', userAuthCheck, removeAddress);
router.get('/forgot-password', getForgotpassword)
router.post('/reset-link', postResetPassLink)
router.get('/resetpass', resetPassword);
router.get('/update-password', getUpdatePass)
router.post('/update-password', postUpdatePass)
router.get('/search-product', getSearch)
router.post('/change-account-details', userAuthCheck, changeAccountDetails)  
router.post('/razorpay-checkout', userAuthCheck, checkoutRazorpay);
router.post('/razorpay-success', userAuthCheck, handleRazorpaySuccess); 
router.get('/view-order', viewOrder);
router.get('/return-items', userAuthCheck, returnItems);
router.get('/return-entire-order', userAuthCheck, returnEntireOrder);
router.get('/shopby-category', userAuthCheck, getShopByCategory)
router.post('/reviews',userAuthCheck, postReview);
router.get('/reviews/product/:productId', getReviews);
router.post('/wallet-checkout', userAuthCheck, walletCheckout);
router.get('/wallet-order-success', userAuthCheck, walletOrderSuccess)
router.get('/cart-count', cartCount)



router.post('/add-to-guestCart', async (req, res) => {
  const { token, productId, quantity } = req.query;

  if (!token || !productId || !quantity) {
      return res.status(400).json({ success: false, message: 'Invalid request parameters' });
  }

  try {
      let guestCart = await GuestCart.findOne({ guestCartId: token });

      const product = await Product.findById(productId);
      if (!product) {
          return res.status(404).json({ success: false, message: 'Product not found' });
      }

      if (guestCart) {
          let itemIndex = guestCart.items.findIndex(item => item.product.toString() === productId);

          if (itemIndex > -1) {
              guestCart.items[itemIndex].quantity += parseInt(quantity);
              guestCart.items[itemIndex].totalPrice = guestCart.items[itemIndex].quantity * guestCart.items[itemIndex].price;
          } else {
              guestCart.items.push({
                  product: productId,
                  quantity: parseInt(quantity),
                  price: product.price,
                  totalPrice: parseInt(quantity) * product.price
              });
          }
      } else {
          guestCart = new GuestCart({
              guestCartId: token,
              items: [{
                  product: productId,
                  quantity: parseInt(quantity),
                  price: product.price,
                  totalPrice: parseInt(quantity) * product.price
              }]
          });
      }

      await guestCart.save();
      res.status(200).json({ success: true, message: 'Product added to guest cart' });

  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
});




module.exports = router;

