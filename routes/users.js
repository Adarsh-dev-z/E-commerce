
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
  handleRazorpaySuccess} = require('../controller/userController');
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

router.get('/login', getLogin)
router.get('/product',userAuthCheck, getProduct)
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
router.get('/cancel-order/:id', userAuthCheck, async (req, res) => {
  const userId = req.user._id;
  const orderId = req.params.id;
  try {
      const order = await Order.findOneAndUpdate(
          { _id: orderId },
          { $set: { orderStatus: 'canceled' } },
          { new: true }
      );
      if (order) {
          const user = await Users.findOne({ _id: userId });
          console.log(order.totalPrice)
          console.log(user.walletAmount)
          if(order.refund===false){
            user.walletAmount = parseFloat(order.totalPrice) + user.walletAmount;
            console.log(user.walletAmount)
            order.refund = true;
          }
          await user.save();
          await order.save();
          res.json({ success: true,message:'Order canceled', order });
      } else {
          res.json({ success: false,message:'Order not found'});
      }
  } catch (error) {
      console.log(error); 
      res.json({ success: false, message: 'An error occurred', error });
  }
});

  
router.get('/register', getRegister);


router.post('/register', userRegister, postRegister);
router.get('/verify', handleVerification);
router.post('/login', postLogin, userLogin)

router.get("/logout", logOut)
router.get('/order-success', (req, res) => {
  res.render('user/order-success');
})
router.get('/razorpay-order-success', (req, res) => {
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


// router.get('/view-order', async (req, res) => {
//   const orderId = req.query.id;
//   if (!orderId) {
//     return res.status(400).send('Missing required query parameters');
//   }
//   // const maxQuantityReached =req.query.maxQuantityReached;
//   const order = await Order.findOne({ _id: orderId}).populate('items.product');
//   console.log('order', order._id);
//   console.log('order items', order.items);
//   res.render('user/view-order', {order, orderId:order._id });
// });

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
    console.log('total return quantity:', totalReturnQuantity)
    return {
      ...item.toObject(),
      maxQuantityReached: totalReturnQuantity >= totalQuantity
    };
  });

  res.render('user/view-order', { order: { ...order.toObject(), items: itemsWithMaxQuantityReached }, orderId });
});


// router.get('/return-items', async (req, res) => {
//   try {
//     const { productId, quantity, reason, orderId } = req.query;
//       if (!productId || !quantity|| !orderId){
//       return res.status(400).send('Missing required query parameters');
//   }
//     const order = await Order.findById(orderId).populate('items.product');
//     if (!order) {
//       return res.status(404).send('Order not found');
//     }
//     const totalQuantity= order.items.filter(item=>item.product._id.toString()===productId).reduce((acc, item)=>acc+item.quantity,0)
//     console.log('totalQuantity', totalQuantity);
//     const totalReturnQuantity = order.returnItems.filter(item=>item.product.toString()===productId).reduce((acc, item)=>acc+item.quantity,0)+Number(quantity)
//     console.log('totalReturnQuantity', totalReturnQuantity);
//     if(totalReturnQuantity > totalQuantity) {
//       return res.status(404).send('you cannot return more products than ordered');
//     }
//   const product = await Product.findById(productId);
//    if (!product) {
//       return res.status(404).send('Product not available now');
//     }
//     const returnAmount = product.price * Number(quantity);
//     const returnItem = order.returnItems.find(item => item.product.toString() === productId);
//     if (returnItem) {
//       console.log(returnItem);
//       returnItem.quantity += Number(quantity);
//     returnItem.returnAmount += returnAmount;
//     console.log(returnItem);
//     } else {
//       order.returnItems.push({
//         product: new mongoose.Types.ObjectId(productId),
//         quantity: Number(quantity),
//         returnAmount,
//         reason,
//         status: 'pending',
//         success: false,
//       });
//     }

//     await order.save();
//     console.log('Order updated:', order);


//     res.redirect(`/view-order?id=${orderId}`);

//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Internal Server Error');
//   }
// });


// router.get('/return-entire-order',async(req, res)=>{
//   const orderId = req.query.id;
//   const order = await Order.findById(orderId).populate('items.product');

//   if (!order) {
//     return res.status(404).send('Order not found');
//   }

//   if (order.returnItems.length === 0) {
//     order.completeOrderReturn=true
//     await order.save()
//     console.log('complete order return',order.completeOrderReturn)
//     res.redirect(`/view-order?id=${orderId}`);

//   }
//   else{

//   }

//   res.redirect(`/view-order?id=${orderId}`);
// })



// Handle returning single items
router.get('/return-items', async (req, res) => {
  try {
    const { productId, quantity, reason, orderId } = req.query;
    // let maxQuantityReached=false

    if (!productId || !quantity || !orderId) {
      return res.status(400).send('Missing required query parameters');
    }

    const order = await Order.findById(orderId).populate('items.product');
    if (!order) {
      return res.status(404).send('Order not found');
    }

    const totalQuantity = order.items
      .filter(item => item.product._id.toString() === productId)
      .reduce((acc, item) => acc + item.quantity, 0);

    const totalReturnQuantity = order.returnItems
      .filter(item => item.product.toString() === productId)
      .reduce((acc, item) => acc + item.quantity, 0) + Number(quantity);

console.log('totalQuantity and totalReturnQuantity', '1:',totalQuantity, '2:',totalReturnQuantity);

    if (totalReturnQuantity > totalQuantity) {
      return res.status(400).send('You cannot return more products than ordered');
    }

    // if(totalQuantity===totalReturnQuantity){
    //   maxQuantityReached=true
    // }
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send('Product not available now');
    }

    const returnAmount = product.price * Number(quantity);
    const returnItem = order.returnItems.find(item => item.product.toString() === productId);

    if (returnItem) {
      returnItem.quantity += Number(quantity);
      returnItem.returnAmount += returnAmount;
    } else {
      order.returnItems.push({
        product: new mongoose.Types.ObjectId(productId),
        quantity: Number(quantity),
        returnAmount,
        reason,
        status: 'pending',
        success: false,
      });
    }

    await order.save();
    // console.log('maxQuantityreached', maxQuantityReached)
    res.redirect(`/view-order?id=${orderId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/return-entire-order', async (req, res) => {
  try {
    const orderId = req.query.id;
    const reason = req.query.reason;
    const order = await Order.findById(orderId).populate('items.product');

    if (!order) {
      return res.status(404).send('Order not found');
    }

    const adjustedItems = order.items.map(item => {
      // const returnItem = order.returnItems.find(returnItem => returnItem.product.toString() === item.product._id.toString() && !returnItem.success);
      const returnItem = order.returnItems.find(returnItem => returnItem.product.toString() === item.product._id.toString());

      console.log('checking returnItem',returnItem)
      if (returnItem) {
        return {
          product: item.product._id,
          quantity: item.quantity - returnItem.quantity,
          price: item.price,
        };
      } else {
        return item;
      }
    }).filter(item=>item.quantity>0);
    console.log('adjusted item', adjustedItems)
    
    for (const item of adjustedItems) {
      if (item.quantity < 0) {
        return res.status(400).send('Invalid return request: more items returned than ordered');
      }

      // const existingReturnItem = order.returnItems.find(returnItem => returnItem.product.toString() === item.product._id.toString() && returnItem.success);
      const existingReturnItem = order.returnItems.find(returnItem => returnItem.product.toString() === item.product._id.toString());
console.log('existing return item',existingReturnItem)
      if (existingReturnItem) {
        existingReturnItem.quantity += item.quantity;
        existingReturnItem.returnAmount += item.quantity * item.price;
      } else {
        order.returnItems.push({
          product: item.product._id,
          quantity: item.quantity,
          returnAmount: item.quantity * item.price,
          reason: reason,
          status: 'pending',
          success: false,
        });
      }
    }

    order.completeOrderReturn = true;
    // const maxQuantityReached = true
    await order.save();

    res.redirect(`/view-order?id=${orderId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});














// //----------------------CHECKOUT---------------------------------------
// require('dotenv').config();

// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// const Order = require('../models/order');
// const Address = require('../models/address');
// const coupon = require('../models/coupon');
// const { Users } = require('../models/user');
// const { emit } = require('process');
// const { addToCart } = require('../utils/cartUtils');
// const address = require('../models/address');

// router.post('/create-checkout-session', AuthCheck, async (req, res) => {
//     let {
//         firstname,
//         lastname,
//         email,
//         telephone,
//         company,
//         address,
//         apartment,
//         city,
//         state,
//         postcode,
//         notes,
//         payment,
//         items = [], // Provide a default value of an empty array if items is not present
//         user
//     } = req.body;

//     console.log(req.body);

//     const newAddress = new Address({
//         firstName: firstname,
//         lastName: lastname,
//         email,
//         telephone,
//         company,
//         address,
//         apartment,
//         city,
//         state,
//         postCode: postcode,
//         notes
//     });

//     await newAddress.save();

//     const userId = req.user._id
//     const order = new Order({
//         user: userId,
//         address: newAddress._id,
//         items,
//         orderID: `ORDER-${Date.now()}`
//     });

//     await order.save();

//     const cart = await Cart.findOne({ user: userId }).populate("items.product")

//     // Check if the cart exists and has items
//     if (!cart || !cart.items || cart.items.length === 0) {
//         return res.status(400).json({ error: 'Cart is empty or invalid' });
//     }

//     items = await Promise.all(
//         cart.items.map(async (item) => {
//             const product = await Product.findById(item.product);
//             return {
//                 price_data: {
//                     currency: 'usd', // Change 'usd' to your desired currency
//                     product_data: {
//                         name: product.name,
//                     },
//                     unit_amount: product.price * 100, // Price in cents
//                 },
//                 quantity: item.quantity,
//             };
//         })
//     );

//     let session;

//     // Check if items array is not empty
//     if (items.length > 0) {
//         session = await stripe.checkout.sessions.create({
//             payment_method_types: ['card'],
//             line_items: items,
//             mode: 'payment',
//             success_url: `${req.headers.origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
//             cancel_url: `${req.headers.origin}/cancel`
//         });
//     } else {
//         // Create a session without line_items for an empty cart
//         session = await stripe.checkout.sessions.create({
//             payment_method_types: ['card'],
//             mode: 'payment',
//             success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
//             cancel_url: `${req.headers.origin}/cancel`
            
//         });
//     }

//     order.stripeSessionId = session.id;
//     await order.save();

//     res.json({ url: session.url });
// });


// ---------------------------original--------------------------------------------
// router.post('/create-checkout-session', AuthCheck, async (req, res) => {
//     console.log(req.body)
//     try {
//         const {
//             firstname,
//             lastname,
//             email,
//             telephone,
//             company,
//             address,
//             apartment,
//             city,
//             state,
//             postcode,
//             notes,
//             payment
//         } = req.body;
        

//         const newAddress = new Address({
//             firstName: firstname,
//             lastName: lastname,
//             email,
//             telephone,
//             company,
//             address,
//             apartment,
//             city,
//             state,
//             postCode: postcode,
//             notes
//         });

//         await newAddress.save();

//         const userId = req.user._id;
//         const order = new Order({
//             user: userId,
//             address: newAddress._id,
//             orderID: `ORDER-${Date.now()}`,
//             payment:payment,

//         });

//         await order.save();


// //         const couponCode = req.session.couponDiscount.couponCode
// //         console.log(couponCode)
// // var totaldiscount = 0

// //         if(req.session.couponDiscount){
// //            totaldiscount= req.session.couponDiscount.reduce((acc, item)=> {
// //             return acc + item.discount
             
// //            },0)
        
// // console.log("discount",totaldiscount)
// //         }

//         const cart = await Cart.findOne({ user: userId }).populate('items.product');

//         if (!cart || !cart.items || cart.items.length === 0) {
//             return res.status(400).json({ error: 'Cart is empty or invalid' });
//         }

//         const items = cart.items.map(item => ({
//             price_data: {
//                 currency: 'inr', 
//                 product_data: {
//                     name: item.product.name,
//                 },
//                 unit_amount: item.product.price * 100, 
//             },
//             quantity: item.quantity,
//         }));



//         const session = await stripe.checkout.sessions.create({
//             payment_method_types: ['card'],
//             line_items: items,
//             mode:'payment',
//             payment_intent_data: {
//                 receipt_email: email,
//                 shipping: {
//                     name: `${firstname} ${lastname}`,
//                     address: {
//                         line1: address,
//                         line2: apartment,
//                         city: city,
//                         state: state,
//                         postal_code: postcode,
//                         country: 'IN' 
//                     }
//                 }
//             },
//             success_url: `${req.headers.origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
//             cancel_url: `${req.headers.origin}/checkout`
//         });
//         // console.log(session)

//         if(req.session.couponDiscount){
//             const{ couponCode, discount }= req.session.couponDiscount;
//             const coupon = await Coupon.findOne({code:couponCode})
//         }

//         order.items= cart.items
//         order.stripeSessionId = session.id;
//         await order.save();
//         // console.log(order)
        


//         res.json({ url: session.url });
//     } catch (error) {
//         console.error('Error creating checkout session:', error);
//         res.status(500).json({ error: 'An error occurred while creating the checkout session.' });
//     }
// });
// ---------------------------original--------------------------------------------





// ---------------------------apply coupon------------------------------------------
// router.post('/apply-coupon', AuthCheck, async(req, res)=>{
//     const couponCode = req.body.couponCode;
//     const coupon = await Coupon.findOne({code:couponCode})
    
//     if(!coupon){
//         return res.json({success: false, message: 'invalid coupon code'})
//     }
   

//     console.log(couponCode)
//     const userId = req.user._id
//     console.log(userId)
//     const cart = await Cart.findOne({user:userId}).populate('items.product')
//     if (!cart || !cart.items || cart.items.length === 0) {
//         return res.json({ success: false, message: 'Cart is empty.' });
//     }
//     const cartTotal = cart.items.reduce((total, item) => {
//        return total + item.totalPrice}, 0);
//     //    if(req.session.couponDiscount && req.session.couponDiscount.length > 0){
//     //     req.session.couponDiscount.push({couponCode:coupon.code, discount:coupon.discount})
//     //    }else{
//     //     req.session.couponDiscount = [{couponCode:coupon.code, discount:coupon.discount}]
//     //     console.log("codeeee",req.session.couponDiscount)
//     //    }
       
//        const discountedTotal = cartTotal-coupon.discount;
//        req.session.couponDiscount = {couponCode:coupon.code, discount: coupon.discount}
//        res.json({success:true, discountedTotal, discount:coupon.discount})
//     //    console.log(discountedTotal)
// })
// ---------------------------original--------------------------------------------

// router.get('/apply-coupon', AuthCheck, async (req, res)=>{
//     const couponCode = req.query.code;
//     console.log(couponCode);
//     coupon = await Coupon.findOne({code:couponCode})
//     const userId = req.user._id;
//    const cart = await Cart.findOne({user:userId})
//    console.log(cart)
//    const cartTotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);

//    const applyCoupon = cartTotal - coupon.discount
//    console.log(applyCoupon)
//    res.render('user/checkout', {applyCoupon})
// })

// ---------------------------apply coupon------------------------------------------












module.exports = router;

