// const passport=require('passport')
const bcrypt = require('bcrypt');
const nodemailer=require('nodemailer')
const { Users: User } = require("../models/user");
const Product = require("../models/product")
const Wishlist = require('../models/wishlist')
const Cart = require('../models/cart')
const Order = require('../models/order')
const Address = require('../models/address')
const Banner = require('../models/banner')
const crypto=require('crypto')
const { createUser, findToken, findProduct, findcart } = require("../helpers/userHelper");
const { addToCart } = require('../utils/cartUtils');

require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Coupon = require('../models/coupon');
const Razorpay = require('razorpay');
const product = require('../models/product');
const order = require('../models/order');
const coupon = require('../models/coupon');



const getLogin = function(req, res) {
  if(req.session.user){
    res.redirect('/home')
  }else{
    res.render('user/login');

  }
  };

  const getProduct = async function(req, res) {
    const productId =req.query.id;
    try {
      const product =await findProduct(productId);
      const relatedProducts =await Product.find({category:product.category}).limit(5);
      console.log('related products:', relatedProducts)
      console.log(product);
      res.render('user/product', { product, relatedProducts });
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal Server Error');
    }
  };

  const getShop = async function(req, res) {
    
let cart = {items: []};
      const product = await Product.find().skip(44)
      // console.log("the product:"+ product)
      if(req.session.user){
        cart = await Cart.findOne({ user: req.session.user._id }).populate("items.product");
        console.log(cart);
        const isLoggedIn=true
       return res.render('user/shop',{ Product:product, user:isLoggedIn, cart});

      }else{
       return res.render('user/shop',{ Product:product, cart});
      }

  };

  const getAbout = function(req, res) {
    res.render('user/about');
  };

  const getBlog = function(req, res) {
    res.render('user/blog');
  };

  const getCart = async function(req, res) {
    const userId = req.user._id;
    try {
      const cart = await Cart.findOne({ user: userId }).populate("items.product");
      console.log(cart);

      if (!cart) {
        return res.render("user/cart", { cart: { items: [] }, cartTotal: 0 });
      }
      const cartTotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);

      res.render("user/cart", { cart, cartTotal });
    } catch (err) {
      console.log(err);
      res.status(500).send("server error");
    }
  };

  const miniCart = async function(req, res) {
   
    const userId = req.user._id;
    try{

      console.log('req coming from shop')
      const cart = await Cart.findOne({user:userId}).populate("items.product")
      console.log('hhhhhhhhhhhhhhhhhhhhhhhhhh',cart)
  
      if(!cart){

        return res.render('user/partials/minicart', {cart: {items:[]}, cartTotal:0})
      }
      const cartTotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);
      // const subTotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);


      
      res.render('user/partials/minicart', {cart, cartTotal});
    } catch(err){
      console.log(err)
      res.status(500).send('server error')
    }
  };

  const updateCartQuantity = async function(req, res) {
    const userId = req.user._id;
    const { productId, action } = req.body;

    try {
        let cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart) {
      return res.status(404).json({success: false, message: 'Cart not found' });
        }

        const productIndex = cart.items.findIndex(item =>item.product._id.toString() === productId);
        if (productIndex === -1) {
            return res.status(404).json({ success:false, message: 'Product not found in cart' });
        }

        const product = cart.items[productIndex].product;
        if (!product) {
          return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // if (action === 'increase') {
        //   cart.items[productIndex].quantity += 1;
        // } else if (action === 'decrease') {
        //   if (cart.items[productIndex].quantity > 1) {
        //     cart.items[productIndex].quantity -= 1;
        //     } else {
        //       cart.items.splice(productIndex, 1); 
        //     }
        // }
        if (action === 'increase') {
          cart.items[productIndex].quantity += 1;
      } else if (action === 'decrease') {
          if (cart.items[productIndex].quantity > 1) {
              cart.items[productIndex].quantity -= 1;
          } else {
              console.log("Quantity cannot be decreased below 1");
          }
      }
      

        cart.items[productIndex].totalPrice = cart.items[productIndex].quantity * product.price;

        await cart.save();

        const cartTotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);

        res.json({
            success: true,
            quantity: cart.items[productIndex] ? cart.items[productIndex].quantity : 0,
            totalPrice: cart.items[productIndex] ? cart.items[productIndex].totalPrice : 0,
            cartTotal: cartTotal
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



  const getCheckout = function(req, res) {

    res.render('user/checkout');
  };

  const getCollection = function(req, res) {
    res.render('user/collection');
  };

  const getComingSoon = function(req, res) {
    res.render('user/coming-soon');
  };

  const getContact = function(req, res) {
    res.render('user/contact');
  };

  const getHome = async function(req, res) {
    const mainBanner = await Banner.find({title:'banner'});
    const squareBanner = await Banner.find({title:'square banner'})
    const products = await Product.find().sort({ createdAt: -1 }).limit(9);
    const charecterAddition = await Product.find({category:'Charecter Edition'}).limit(3);
    const womesProduct = await Product.find({category:'Most Popular'}).limit(3);
    const mostpopular = await Product.find().limit(3);
    
    let cart = {items: []};
    
    
    
        console.log(mainBanner)
        if(req.session.user){
          cart = await Cart.findOne({ user: req.session.user._id }).populate("items.product");
          const userName=req.session.user.username
          console.log(userName)
          let showWelcomeMessage = false;
          if(!req.session.seenWelcomeMessage){
            showWelcomeMessage = true;
            req.session.seenWelcomeMessage = true;
          }
          const isLoggedIn = true
          res.render('user/home',{user:true, banner:mainBanner, squareBanner, products, charecterAddition, womesProduct, mostpopular,cart, userName, showWelcomeMessage});
    
          
        }
        res.render('user/home', {banner:mainBanner, squareBanner, products, charecterAddition, womesProduct, mostpopular, cart });
      };
    
    

  const getRegister = function(req, res) {
    res.render('user/register');
  };

  const getWishlist = async function(req, res) {
    const userId = req.user._id;
    console.log(userId)
    try{
      const wishlist = await Wishlist.findOne({user:userId}).populate('products');
      res.render('user/wishlist',{wishlist: wishlist? wishlist.products: []});
    }catch(err){
      console.error(err);
      res.status(500).json({success: false, message: 'Server error'});
    }
  };

  const redirectHome = function(req, res) {
    res.redirect('/home');
  };

  const getUserProfile= async function(req, res){
  try{
    const userId = req.user._id
    const order = await Order.find({user:userId}).populate('items.product')
    const orderCount = await Order.countDocuments({user:userId})
    const user = await User.findById({_id:userId})
    const pendingOrders = await Order.countDocuments({user:userId, orderStatus:"pending"});
    const awaitingDeliveryOrders = await Order.countDocuments({
      user: userId,
      orderStatus: { $nin: ["delivered", "cancelled"] }
  });

  const returnOrderItems = await Order.find({user:userId}).populate('returnItems.product')
  console.log('orders',returnOrderItems)
  
  const findReturnItems = returnOrderItems.flatMap(order => 
    order.returnItems.map(item => ({ ...item.toObject(), orderID: order.orderID }))
  );

  
  console.log('find return Items', findReturnItems);

  
    const address = await Address.find({user:userId}).populate('user')
    const wishlist = await Wishlist.findOne({user:userId}).populate('products')
    console.log("wishlist is ", wishlist)

    res.render("user/userprofile",{
      order,
      orderCount,
      user,
      pendingOrders,
      address,
      wishlist,
      awaitingDeliveryOrders,
      findReturnItems
      
    })
  }catch(err){
    console.log(err)
  }

  }

  const postRegister = function(req, res){
    try{
      const registeredUser = req.user;
      req.session.user= req.user;
      req.session.loggedIn = true;
      res.redirect("home");
      console.log("User signed and logged in");
    }catch(err){
      console.log(err);
    }
  }


  const userLogin = (req, res) => {
    try {
      const validateUser = req.user;
      req.session.user = validateUser;
      const validateAdmin = req.admin;
      req.session.admin = validateAdmin;
      req.session.loggedIn = true;
  
      let redirectUrl;
      if (req.session.user) {
        redirectUrl = '/home';
        console.log('user authenticated and logged in');
      } else if (req.session.admin) {
        redirectUrl = '/admin';
        console.log('admin authenticated and logged in');
      }
  
      res.json({ success: true, clearGuestCart: true, redirectUrl });
    } catch (err) {
      console.log(err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
  
  
  
  
  

  

  const callbackUrl = (req, res)=>{
    console.log("reqest user:",req.user)
    res.redirect('/home')
  }

  const logOut= (req, res)=>{
    req.session.destroy()
    res.redirect("/home")
  }


  //+++++++++++++++++++++++++++++++++++++++++
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'adarsh7013a@gmail.com',
      pass: process.env.APP_PASSWORD 
    }
  });
  
  function generateToken() {
    const token = crypto.randomBytes(20).toString('hex');
    const expireTime = Date.now()+ 3600000;
    return {token, expireTime}
  }

  
async function userRegister(req, res, next) {
  const username = req.body.username;
  const phone = req.body.mobile;
  const email = req.body.email;
  const password = req.body.password;

  if (username === "" || phone === "" || email === "" || password === "") {
    return res.render("user/register", { errorMessage: "all fields are required" });
  }

  if (phone.length < 8 || phone.length > 12) {
    return res.render("user/register", { errorMessage: "phone number length should be between 8 to 12 digits" });
  }

  if (username.length <3 || username.length > 20){
    return res.render('user/register', {errorMessage: 'user name should be 3 to 20 long'})
  }

  const dbEmail = await User.findOne({ email: email });
  if (dbEmail === null) {
    const {token, expireTime} = generateToken();

    const verificationLink = `http://localhost:3001/verify?token=${token}`;
    transporter.sendMail({
      from: 'adarsh7013a@gmail.com',
      to: email,
      subject: 'Email Verification',
      html: `Hi, click <a href="${verificationLink}">here</a> to verify your email.`
    }, async (err) => {
      if (err) {
        console.error('Error sending email:', err);
        return res.status(500).send('Error sending email');
      } else {
        const hashedPass = await bcrypt.hash(password, 10);
        // user.password = hashedPass;
        const data = {
          username:username,
          email:email,
          phone:phone,
          password:hashedPass,
          verificationToken:token,
          tokenExpires: expireTime
        
        }
        const user = await createUser(data)
        // Store token in the database
        // const newUser = new User({
        //   username,
        //   phone,
        //   email,
        //   password,
        //   verificationToken: token
        // });
        // await newUser.save();

        res.send('Verification email sent successfully!');
      }
    });
  } else {
    return res.render("user/register", { errorMessage: "user already exist, kindly login" });
  }
}



//++++++++++++++++++++++++++++++++++

// async function handleVerification(req, res) {
//   const token = req.query.token;
//   // const user = await User.findOne({ verificationToken: token });
//   const user = await findToken(token)

//   if (user) {
    
//     // Remove token from the user object
//     user.verificationToken = undefined;
//     // delete user.verificationToken

    
//     // Hash the password
//     // const hashedPass = await bcrypt.hash(user.password, 10);
//     // user.password = hashedPass;

//     // Save the user
//     user.isVerifyed="true"
//     await user.save();

//     // Add the user to the session
//     req.session.user = user;
//     req.session.loggedIn = true;

//     return res.redirect('/home');
//   } else {
//     return res.status(400).send('Invalid or expired token');
//   }
// }
async function handleVerification(req, res) {
  const token = req.query.token;
  console.log(token)
  const user = await findToken(token);
  console.log(user)

  if (!user) {
    return res.status(400).send('Invalid token');
  }

  if (Date.now() > user.tokenExpires) {
    return res.status(400).send('Token expired');
  }

  user.verificationToken = undefined;
  user.tokenExpires = undefined;

  user.isVerifyed = "true";

  await user.save();

  req.session.user = user;
  req.session.loggedIn = true;

  return res.redirect('/home');
}

// --------------------------COMMENTED POST LOGIN MOD FOR GUST CART--------------------------------------------------


const postLogin = async (req, res) => {
  try {
    const { email, password, guestCart } = req.body;
    const parsedGuestCart = JSON.parse(guestCart || '[]');

    const user = await User.findOne({ email: email, role: 'user' });
    const admin = await User.findOne({ email: email, role: 'admin' });
    const currentUser = user || admin;

    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if(currentUser.isBlocked){
      return res.status(403).json({ success: false, message: 'User is blocked' });
    }
    if (currentUser.isVerifyed !== 'true') {
      return res.status(403).json({ success: false, message: `${currentUser.role} not verified` });
    }

    const passwordMatch = await bcrypt.compare(password, currentUser.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    console.log("user id",currentUser._id)
   await addToCart(currentUser._id, parsedGuestCart)

    // req.session.userId = user._id;
    req.session.role = currentUser.role;
    req.session.user = user ? currentUser : null;
    req.session.admin = admin ? currentUser : null;

    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
      }

      let redirectUrl;
      if (req.session.user) {
        redirectUrl = '/home';
        console.log('user authenticated and logged in');
      } else if (req.session.admin) {
        redirectUrl = '/admin';
        console.log('admin authenticated and logged in');
      }

      res.json({ success: true, clearGuestCart: true, redirectUrl, role: currentUser.role });
    });

  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


const postAddToWishlist = async (req, res)=>{
  try {
      const productId= req.body.id;
      console.log(productId)
      if(!productId){
          return res.status(400).json({ success:false, message:'product not found'});
      }else{
         const userId = req.user._id
          console.log(userId)

          let wishlist = await Wishlist.findOne({user: userId});
          if(!wishlist){
           wishlist = new Wishlist({user: userId, products: []})
          }
          if(!wishlist.products.includes(productId)){
              wishlist.products.push(productId);
              await wishlist.save();
          }
          res.status(200).json({success:true, message:'product added to wishlist'})
      }
  }catch(err){
      console.log(err);
      res.status(500).json({success:false, message:'internal server error'})
  }
}

const GetRemoveWishlist = async (req, res)=>{
  try{
      const productId = req.query.id;
  const userId = req.user._id
  console.log(productId, userId)
  const updateWishlist = await Wishlist.findOneAndUpdate({user: userId}, {$pull:{products: productId}},
      {new: true}
  )
  if(updateWishlist){
      console.log('product removed succesfully');
      res.json({success:true});

  }else{
      console.log('error removing item');
      res.json({success:false});
  }
  }
  catch(err){
      console.log(err);
      res.status(500).json({success:false, message:'internal server error'})
  }
  
}

const postAddToCart = async (req, res) => {
  const productId = req.params.id;
  const userId = req.user._id;

  if (!productId) {
    return res.status(400).send('Product not found');
  }

  const itemsToAdd = [{ productId, quantity: 1 }];
  console.log('items to add', itemsToAdd);
  try {
    await addToCart(userId, itemsToAdd);
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).send('Internal server error');
  }
};


const postRemoveCart = async (req, res) => {
  try {
      const productId = req.params.id;
      const userId = req.user._id;

      await Cart.findOneAndUpdate(
          { user: userId },
          { $pull: { items: { product: productId } } },
          { new: true }
      );

      res.status(200).json({ message: 'Product removed from cart' });
      
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while removing the product from the cart' });
  }
}
// --------------------------COMMENTED POST LOGIN MOD FOR GUST CART--------------------------------------------------



// const postLogin= async (req,res,next)=>{
//   const email = req.body.email;
//   const password = req.body.password;
//   // const notVerified = await User.findOne({email:email, role:'user', isVerifyed:false})
//   const user = await User.findOne({email:email, role:'user'});
//   const admin = await User.findOne({email:email, role:'admin'})
//   if(user || admin){
//     currentUser = user || admin;

//     //
//     if(currentUser.isVerifyed==='true'){
//       const passwordMatch = await bcrypt.compare(password, currentUser.password)
//     if(passwordMatch){
//       console.log(currentUser.role + 'login successful')
//       req.user = user;
//       req.admin = admin;
//       next()
//     } else{
//       console.log("invalid password");
//       return res.render("user/login",{errorMessage:'invalid password'})
//     }
//   }if(currentUser.isVerifyed==='false'){
//     console.log(currentUser.role + 'is not verified')
//     return res.render('user/login', {errorMessage: currentUser.role +' not verified', verificationPopup: true})

//   }
  
  
//   else{
//     console.log("user not verifiedzzzzzzzzz");
//       return res.render("user/login", { errorMessage: 'user not verified..................'});
//   }
//     }
    
//   else{
//     console.log('user not found');
//     return res.render('user/login', {errorMessage:'user not found'})
//   }
// }
//+++++++++++++++++++++++++++++++++++++++

const getClearCart = async (req, res) => {
  const userId = req.user._id;
  const clearCart = await Cart.findOneAndUpdate({user:userId}, {$set:{items:[]}},{new:true})
  if(clearCart){
      console.log("cart cleared")
      res.redirect('/cart');
  }else{
      console.log("error clearing cart")
      res.redirect('/cart');
  }
  
}

const getProductCheckout = async (req, res)=>{
  const userId = req.user._id
  const cartId = req.query.id
  // console.log(cartId)
  const USER = await User.findById(userId)
  const orderCount = await Order.countDocuments({ user: userId });
  const address = await Address.find({user:userId}).lean()

  
  const cart = await Cart.findOne({user:userId}).populate('items.product').lean();
  // console.log("cart items"+cart)

  const cartTotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);
  const coupon = await Coupon.findOne({minPriceRange:{$lt:cartTotal},maxPriceRange:{$gt:cartTotal}})
  console.log("coupon"+coupon)
  // if(cartTotal)

      console.log(coupon)
  res.render('user/checkout',{cart, cartTotal, coupon, orderCount, USER, address})
}

const getOrderSuccess = async(req, res)=>{
  const sessionId = req.query.session_id;
  const userId = req.user._id

  // console.log(sessionId);
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['total_details.breakdown.discounts']
  })
  console.log('session is:',session)
  // const order = await Order.findOne({stripeSessionId:sessionId}).populate('address').populate('items.product')
  const address=await Address.findById(session.metadata.addressId).lean()
  console.log('address in session.metadata',address)
  const userCart = await Cart.findOne({user:userId}).populate('items.product')
  const order = new Order({
    user: userId,
    address: address._id,
    orderID: `ORDER-${Date.now()}`,
    payment: 'stripe',
    items: userCart.items,
    
});

await order.save();

  if(!order){
      return res.status(400).send('order not found');
      }
      else{

          order.totalPrice = session.amount_total / 100
          let couponCode = null;
  let discountAmount = 0;

  if (session.total_details && session.total_details.breakdown && session.total_details.breakdown.discounts) {
      const discount = session.total_details.breakdown.discounts[0];
      console.log('discount',discount)
      if (discount) {
          // couponCode = discount.coupon.id; 
          discountAmount = discount.amount / 100; 
          order.discountAmount =discountAmount;
          await order.save();
          
      }
  }


  if(!order.stockUpdated){
      // console.log('order befor', order.stockUpdated)
      try{
          for(const item of order.items){
              const product = await Product.findById(item.product._id);
              if(product){
                  // console.log('product befor', product.stock)
                  product.stock -=item.quantity;

                  await product.save();
                  // console.log('product after', product.stock)
              }
          }
          order.stockUpdated=true;
          await order.save();
          // console.log('order after', order.stockUpdated)
      }catch (err){
          console.err('error updating product stock', err);
          return res.status(500).send('error updating product stock')
      }
  }


          const deliveryDate = new Date();
          deliveryDate.setDate(deliveryDate.getDate()+5);
          const formatedDate = deliveryDate.toLocaleDateString('en-US',{
              year:'numeric',
              month:'long',
              day:'numeric'
          })          
          order.deliveryExpectedDate = formatedDate;
          await order.save();  
// console.log(session.amount_discount)
// console.log(session.amount_off)
          // console.log(order.items)
          const clearCart = await Cart.findOneAndDelete({user:userId})
          if(clearCart){
            console.log('cart deleted');
          }else{
            console.log('error updating cart')
          }
          console.log('user order:',order)
          console.log('address:',order.address)
          res.render('user/order-success',{
              order,
              address:address,
              items:order.items,
              total:session.amount_total / 100,
              subtotal:session.amount_subtotal / 100,
              currency:session.currency,
              deliveryExpectedDate:formatedDate,
              // couponCode,
              discountAmount
              
              

          })
      }
  
  
}


const postApplyCoupon = async (req, res) => {
  const couponCode = req.body.couponCode;
  const coupon = await Coupon.findOne({ code: couponCode });

  if (!coupon) {
      return res.json({ success: false, message: 'Invalid coupon code' });
  }

  const userId = req.user._id;
  const cart = await Cart.findOne({ user: userId }).populate('items.product');

  if (!cart || !cart.items || cart.items.length === 0) {
      return res.json({ success: false, message: 'Cart is empty.' });
  }

  const cartTotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);

  if (!req.session.couponDiscount) {
      req.session.couponDiscount = [];
  }

  req.session.couponDiscount.push({ couponCode: coupon.code, discount: coupon.discount });

  const discountedTotal = cartTotal - coupon.discount;
  res.json({ success: true, discountedTotal, discount: coupon.discount });
}

const postRemoveCoupon = async (req, res) => {
  if (!req.session.couponDiscount || req.session.couponDiscount.length === 0) {
      return res.json({ success: false, message: 'No coupon applied.' });
  }

  req.session.couponDiscount = [];

  const userId = req.user._id;
  const cart = await Cart.findOne({ user: userId }).populate('items.product');

  if (!cart || !cart.items || cart.items.length === 0) {
      return res.json({ success: false, message: 'Cart is empty.' });
  }

  const cartTotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);
  res.json({ success: true, newTotal: cartTotal });
}


// const createCheckoutSession = async (req, res) => {
//   const userId = req.user._id
//   console.log(req.body);
//   try {
//       const {
//           firstname,
//           lastname,
//           email,
//           telephone,
//           company,
//           address,
//           apartment,
//           city,
//           state,
//           postcode,
//           notes,
//           payment
//       } = req.body;

//       const existingAddress = await Address.findOne({
//           user:userId,
//           firstName: firstname,
//           lastName: lastname,
//           email:email,
//           telephone:telephone,
//           company:company,
//           address:address,
//           apartment:apartment,
//           city:city,
//           state:state,
//           postCode: postcode,
//       })
//       let useAddress;
//       if(existingAddress){
//           useAddress= existingAddress;
//       }else{

//           const newAddress = new Address({
//               user:userId,
//               firstName: firstname,
//               lastName: lastname,
//               email,
//               telephone,
//               company,
//               address,
//               apartment,
//               city,
//               state,
//               postCode: postcode,
//               notes
//           });
  
//          useAddress= await newAddress.save();
//       }

//       // const userId = req.user._id;
//       const order = new Order({
//           user: userId,
//           address: useAddress._id,
//           orderID: `ORDER-${Date.now()}`,
//           payment: payment,
          
//       });

//       await order.save();

//       const cart = await Cart.findOne({ user: userId }).populate('items.product');

//       if (!cart || !cart.items || cart.items.length === 0) {
//           return res.status(400).json({ error: 'Cart is empty or invalid' });
//       }

//       const items = cart.items.map(item => ({
//           price_data: {
//               currency: 'inr', 
//               product_data: {
//                   name: item.product.name,
//               },
//               unit_amount: item.product.price * 100, 
//           },
//           quantity: item.quantity,
//       }));

//       const sessionData = {
//           payment_method_types: ['card'],
//           line_items: items,
//           mode: 'payment',
//           payment_intent_data: {
//               receipt_email: email,
//               shipping: {
//                   name: `${firstname} ${lastname}`,
//                   address: {
//                       line1: address,
//                       line2: apartment,
//                       city: city,
//                       state: state,
//                       postal_code: postcode,
//                       country: 'IN'
//                   }
//               }
//           },
//           success_url: `${req.headers.origin}/userOrder-success?session_id={CHECKOUT_SESSION_ID}`,
//           cancel_url: `${req.headers.origin}/product-checkout`,
//           expand: ['total_details.breakdown.discounts'],
//       };
     

      
//       if (req.session.couponDiscount && req.session.couponDiscount.length > 0) {
//           const totalDiscount = req.session.couponDiscount.reduce((acc, item) => acc + item.discount, 0);
//           sessionData.discounts = [{
//               coupon: req.session.couponDiscount[0].couponCode
//           }];
//           console.log("Applied coupon:", req.session.couponDiscount[0]);
//           console.log("Total discount:", totalDiscount);
//           console.log("Session data:", sessionData);
//       }

//       const session = await stripe.checkout.sessions.create(sessionData);
//       console.log('hiiii', session.total_details.breakdown.discounts);
//       order.items = cart.items;
//       order.stripeSessionId = session.id;
//       await order.save();

//       req.session.couponDiscount = [];
//       res.json({ url: session.url });
//       // const couponDetails = req.session.couponDiscount;
//       // console.log("coupon details in session", couponDetails)
//       // req.session.couponDiscount === undefined
//   } catch (error) {
//       console.error('Error creating checkout session:', error);
//       res.status(500).json({ error: 'An error occurred while creating the checkout session.' });
//   }
// }

const createCheckoutSession = async (req, res) => {
  const userId = req.user._id
  console.log(req.body);
  try {
      const {
          firstname,
          lastname,
          email,
          telephone,
          company,
          address,
          apartment,
          city,
          state,
          postcode,
          notes,
          payment
      } = req.body;

      const existingAddress = await Address.findOne({
          user:userId,
          firstName: firstname,
          lastName: lastname,
          email:email,
          telephone:telephone,
          company:company,
          address:address,
          apartment:apartment,
          city:city,
          state:state,
          postCode: postcode,
      })
      let useAddress;
      if(existingAddress){
          useAddress= existingAddress;
      }else{

          const newAddress = new Address({
              user:userId,
              firstName: firstname,
              lastName: lastname,
              email,
              telephone,
              company,
              address,
              apartment,
              city,
              state,
              postCode: postcode,
              notes
          });
  
         useAddress= await newAddress.save();
      }

      // const userId = req.user._id;
      

      const cart = await Cart.findOne({ user: userId }).populate('items.product');

      if (!cart || !cart.items || cart.items.length === 0) {
          return res.status(400).json({ error: 'Cart is empty or invalid' });
      }

      const items = cart.items.map(item => ({
          price_data: {
              currency: 'inr', 
              product_data: {
                  name: item.product.name,
              },
              unit_amount: item.product.price * 100, 
          },
          quantity: item.quantity,
      }));

      const sessionData = {
          payment_method_types: ['card'],
          line_items: items,
          mode: 'payment',
          payment_intent_data: {
              receipt_email: email,
              shipping: {
                  name: `${firstname} ${lastname}`,
                  address: {
                      line1: address,
                      line2: apartment,
                      city: city,
                      state: state,
                      postal_code: postcode,
                      country: 'IN'
                  }
              }
          },
          metadata:{
            userId:userId.toString(),
            addressId:useAddress._id.toString(),
            couponDiscount:req.session.couponDiscount.toString()
          },
          success_url: `${req.headers.origin}/userOrder-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${req.headers.origin}/product-checkout`,
          expand: ['total_details.breakdown.discounts'],
      };
     

    //   const order = new Order({
    //     user: userId,
    //     address: useAddress._id,
    //     orderID: `ORDER-${Date.now()}`,
    //     payment: payment,
        
    // });

    // await order.save();
      
      if (req.session.couponDiscount && req.session.couponDiscount.length > 0) {
          const totalDiscount = req.session.couponDiscount.reduce((acc, item) => acc + item.discount, 0);
          sessionData.discounts = [{
              coupon: req.session.couponDiscount[0].couponCode
          }];
          console.log("Applied coupon:", req.session.couponDiscount[0]);
          console.log("Total discount:", totalDiscount);
          console.log("Session data:", sessionData);
      }

      const session = await stripe.checkout.sessions.create(sessionData);
      console.log('hiiii', session.total_details.breakdown.discounts);
      // order.items = cart.items;
      // order.stripeSessionId = session.id;
      // await order.save();

      req.session.couponDiscount = [];
      res.json({ url: session.url });
      // const couponDetails = req.session.couponDiscount;
      // console.log("coupon details in session", couponDetails)
      // req.session.couponDiscount === undefined
  } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: 'An error occurred while creating the checkout session.' });
  }
}



const editAddress = async(req, res)=>{
  const addressId = req.params.id
  const { firstname,lastname, email, telephone, company, address, apartment, city, postcode, street, state } = req.body
  if(!firstname.trim() || !lastname.trim() || !email.trim() || !telephone.trim() || !company.trim() || !address.trim() || !city.trim() || !postcode.trim() || !street.trim() || !state.trim()){
      return res.status(400).json({success:false, message:'Please provide all required fields'})
  }
  if (!firstname || !lastname || !/^[a-zA-Z]+$/.test(firstname) || !/^[a-zA-Z]+$/.test(lastname)) {
      return res.status(400).json({success:false, message:'Please provide valid names'});
  }
  if (!telephone || !/^\d+$/.test(telephone)) {
      return res.status(400).json({success:false, message:'Please provide a valid mobile number'});
  }
  try{

      const findAddress = await Address.findOneAndUpdate({_id:addressId},{
          firstName:firstname,
          lastName:lastname,
          email:email,
          telephone:telephone,
          company:company,
          address:address,
          apartment:apartment,
          city:city,
          postCode:postcode,
          state:state,
          street:street
  },{ new: true })
  if (!findAddress) {
      return res.status(404).json({ success: false, message: 'Address not found' });
  }
   res.json({ success: true, message: 'Address updated successfully'});
  }catch(err){
      console.log(err);
      return res.status(500).json({success:false, message:'internal server error'})
  }
}

const postAddAddress = async(req, res)=>{
  userId = req.user._id;
  const { firstname,lastname, email, telephone, company, address, apartment, city, postcode, street, state } = req.body
  if(!firstname.trim() || !lastname.trim() || !email.trim() || !telephone.trim() || !company.trim() || !address.trim() || !city.trim() || !postcode.trim() || !street.trim() || !state.trim()){
      return res.status(400).json({success:false, message:'Please provide all required fields'})
  }
  if (!firstname || !lastname || !/^[a-zA-Z]+$/.test(firstname) || !/^[a-zA-Z]+$/.test(lastname)) {
      return res.status(400).json({success:false, message:'Please provide valid names'});
  }
  if (!telephone || !/^\d+$/.test(telephone)) {
      return res.status(400).json({success:false, message:'Please provide a valid mobile number'});
  }
  
  try{

      const newAddress = await Address.create({
          user:userId,
          firstName:firstname,
          lastName:lastname,
          email:email,
          telephone:telephone,
          company:company,
          address:address,
          apartment:apartment,
          city:city,
          postCode:postcode,
          state:state,
          street:street
  
      })
      res.status(200).json({success:true, message:'address added successfully'})
  }catch(err){
      console.log(err);
      return res.status(500).json({success:false, message:'error adding address'})
  }
}


const removeAddress = async (req, res) => {
  try {
      const addressId = req.params.id;
      const address = await Address.findByIdAndDelete(addressId);
      if (address) {
          console.log('Address deleted');
          res.json({ success: true, message: 'Address deleted successfully' });
      } else {
          console.log('Address not found');
          res.json({ success: false, message: 'Address not found' });
      }
  } catch (err) {
      console.log('Error removing address:', err);
      res.status(500).json({ success: false, message: 'Internal server error, error removing address' });
  }
}

const getForgotpassword = (req, res)=>{
  res.render('user/forgot-password')
}

const postResetPassLink = async(req, res)=>{

  function generateToken() {
    const token = crypto.randomBytes(20).toString('hex');
    const expireTime = Date.now()+ 3600000;
    return {token, expireTime}
  }

  try{
      const userEmail = req.body.email;
      const user = await Users.findOne({email:userEmail});
      if(!user){
          return res.status(400).send('user not found')
      }
      const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'adarsh7013a@gmail.com',
            pass: process.env.APP_PASSWORD 
          }
        });
  
       
        const {token, expireTime}= generateToken();
        user.tokenExpires =expireTime
        user.verificationToken =token;
        console.log(user)
        await user.save()
  
        const verificationLink = `http://localhost:3001/resetpass?token=${token}`;
        transporter.sendMail({
          from: 'adarsh7013a@gmail.com',
          to: userEmail,
          subject: 'Email Verification',
          html: `Hi, click <a href="${verificationLink}">here</a> to verify your email.`
          })

          res.send('Verification email sent successfully!');
          async (err)=>{
              console.log(err)
              if(err){
                  return res.status(500).send('errror sending link')
              }else{
                  res.send('we sent a link to reset your password.')
              }
          }
          // req.session.email=userEmail;
          // console.log(req.session.email,"email in session")
  }catch(err){
      console.log(err);
      return res.status(500).send('error resetting your password')
  }

}


const resetPassword = async function resetPassword(req, res) {
  const token = req.query.token;
  console.log(token)
  const user = await Users.findOne({verificationToken:token});
  console.log(user)

  if (!user) {
    return res.status(400).send('Invalid token');
  }

  if (Date.now() > user.tokenExpires) {
    return res.status(400).send('Token expired');
  }

  user.verificationToken = undefined;
  user.tokenExpires = undefined;

    await user.save();
const email= user.email;
req.session.email=email
    
  // req.session.loggedIn = true;
console.log("latest user: ",user)
  return res.redirect('/update-password');
}


const getUpdatePass = (req, res)=>{
  res.render("user/update-password")
}


const postUpdatePass = async(req, res)=>{
  const {password, confirmpassword} = req.body;
  if(password===confirmpassword){

      const hashedPassword = await bcrypt.hash(password,10)
      const email = req.session.email;
      const user = await Users.findOneAndUpdate({email:email},{
          password:hashedPassword
      },{new:true});
      console.log('user password reseted')
      res.redirect('/login')
      
  }
}

const getSearch = async(req, res)=>{

  const keyword = req.query.keyword
  const product = await Product.find({name:{$regex:new RegExp(keyword,'i')}}).lean();
  res.render('user/shop',{Product:product})
}

const changeAccountDetails = async(req, res)=>{

  console.log(req.body)
  const {username, mobile, email, currentpassword, newpassword, confirmpassword } = req.body
  if(!username.trim() || !mobile.trim() || !email.trim() || !currentpassword || !newpassword || !confirmpassword){
      console.log('all fields are required')
      // return res.render('user/userprofile', {errorMessage:'all fields are required'})
      return res.json({success:false, message:'all fields are required'})
  }
  if(username.length<3 || username.length>20){
  console.log('username must be between 3 and 20 characters');
      // return res.render('user/userprofile', {errorMessage:"username must be between 3 and 20 characters"})
      return res.json({success:false, message:"username must be between 3 and 20 characters"})
  }
  if(mobile.length<8|| mobile.length>12){
  console.log('mobile number must be between 8 and 12 characters');
      // return res.render('user/userprofile', {errorMessage:'mobile number must be between 8 and 12 characters'})
      return res.json({success:false, message:'mobile number must be between 8 and 12 characters'})
  }
  if(!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(newpassword)){
  console.log('password must contain at least 8 characters, including a small letter, a capital letter, a symbol, and a number');
      // return res.render('user/userprofile', {errorMessage:'password must contain at least 8 characters, including a small letter, a capital letter, a symbol, and a number'})
      return res.json({success:false, message:'password must contain at least 8 characters, including a small letter, a capital letter, a symbol, and a number'})
  }
  const user = await Users.findOne({email:email})
  if(!user){
      console.log('user not found')
      // return res.render('user/userprofile', {errorMessage:'user not found'});
  }
  const passwordMatch = await bcrypt.compare(currentpassword, user.password)
  if(passwordMatch){
      if(newpassword===confirmpassword){
          const hashedPassword = await bcrypt.hash(newpassword,10)
          const updatePassword = await Users.findOneAndUpdate({email:email},{
              username:username,
              email:email,
              mobile:mobile,
              password:hashedPassword
          }, {new:true})
          console.log('user details updated', 'password updated')
          return res.json({success:true, message:'user details updated'})
      }else{
          console.log('newpassword not matching with confirmpassword')
          res.json({success:false, message:'newpassword not matching with confirmpassword'})
      }
  }else{
      console.log('current password not matching')
      res.redirect('/userprofile')
  }
}

// ---------------------------RAZORPAY----------------------------------------------

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const checkoutRazorpay = async (req, res) => {

  const userId = req.user._id;

  const {
    firstname,
    lastname,
    email,
    telephone,
    company,
    address,
    apartment,
    city,
    state,
    postcode,
    notes,
    payment
} = req.body;

const existingAddress = await Address.findOne({
  user:userId,
  firstName: firstname,
  lastName: lastname,
  email:email,
  telephone:telephone,
  company:company,
  address:address,
  apartment:apartment,
  city:city,
  state:state,
  postCode: postcode,
})
let userAddress;
if(existingAddress){
  userAddress= existingAddress;
}else{

  const newAddress = new Address({
      user:userId,
      firstName: firstname,
      lastName: lastname,
      email,
      telephone,
      company,
      address,
      apartment,
      city,
      state,
      postCode: postcode,
      notes
  });

 userAddress= await newAddress.save();
}


  try {
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.json({ success: false, message: 'Cart is empty.' });
    }
    const items= cart.items.map(item => {
      return {
        name: item.product.name,
        quantity: item.quantity,
        currency: 'INR',
        amount: item.totalPrice
      }
    })
    console.log('items',items)
    const cartTotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);
    let couponDiscount = 0;
    if(req.session.couponDiscount){
       req.session.couponDiscount.forEach(discount => {
          couponDiscount += discount.discount;
       });
    }
    const newCartTotal = cartTotal - couponDiscount;
    req.session.couponDiscount = [];
    const options = {
      amount: newCartTotal * 100, // amount in smallest currency unit
      currency: 'INR',
      receipt: crypto.randomBytes(10).toString('hex')
    };

    const order = await razorpay.orders.create(options);

    const razorpayOptions = {
      key: process.env.RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'My Ecommerce',
      description: 'Test transaction',
      order_id: order.id,
      prefill: {
        name: firstname+' '+lastname,
        email: email,
        contact: telephone
      },
      notes: {
        
        address: userAddress._id, couponDiscount:couponDiscount
      },
      callback_url: `${process.env.BASE_URL}/razorpay-success`,  
    };
    
     
      // const existingAddress = await Address.findOne({
      //     user:userId,
      //     firstName: firstname,
      //     lastName: lastname,
      //     email:email,
      //     telephone:telephone,
      //     company:company,
      //     address:address,
      //     apartment:apartment,
      //     city:city,
      //     state:state,
      //     postCode: postcode,
      // })
      // let useAddress;
      // if(existingAddress){
      //     useAddress= existingAddress;
      // }else{

      //     const newAddress = new Address({
      //         user:userId,
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
  
      //    useAddress= await newAddress.save();
      // }

      // const userOrder = new Order({
      //     user: userId,
      //     address: useAddress._id,
      //     orderID: `ORDER-${Date.now()}`,
      //     payment: payment,
      //     items: cart.items,
      //     total: newCartTotal,
      //     couponDiscount: couponDiscount,
        
      // });

      // console.log('userOrder',userOrder)
      // await userOrder.save();      
    
    res.json({ razorpayOptions });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).send({ error: error.message });
  }
};



const handleRazorpaySuccess = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch user's cart and calculate the new cart total
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || !cart.items.length) {
      return res.status(400).send({ error: 'Cart is empty' });
    }

    const couponDiscount = 0;
    const newCartTotal = cart.items.reduce((total, item) => total + item.totalPrice, 0) - couponDiscount;

    const { razorpay_payment_id, razorpay_order_id } = req.body;
    const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
    console.log('paymentDetails:', paymentDetails);

    // Calculate delivery date
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);
    const formatedDate = deliveryDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const userOrder = new Order({
      user: userId,
      address: paymentDetails.notes.address,
      orderID: `ORDER-${Date.now()}`,
      payment: 'razorpay',
      items: cart.items,
      totalPrice: paymentDetails.amount / 100,
      discountAmount: paymentDetails.notes.couponDiscount,
      deliveryExpectedDate: formatedDate,
    });

    console.log('userOrder:', userOrder);
    await userOrder.save();

    console.log('cart.items:', cart.items);

    await Promise.all(cart.items.map(async (item) => {
      const product = item.product;
      product.stock -= item.quantity;
      if (product.stock <= 0) {
        product.isOutOfStock = true;
      }
      await product.save();
      console.log('updateStock:', product);
    }));

    userOrder.stockUpdated = true;
    await userOrder.save();
    console.log('stockUpdated:', userOrder);
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();
    console.log('cart cleared:', cart);
    const userAddress = await Address.findById(paymentDetails.notes.address);

    const subtotal=parseFloat(userOrder.totalPrice)+parseFloat(userOrder.discountAmount)
    return res.render(`user/order-success`, {
      // paymentId:razorpay_payment_id,
      // orderId:razorpay_order_id,
      // newCartTotal,
      // couponDiscount,
      // userOrder,
      order:userOrder,
      address: userAddress,
      items:userOrder.items,
      total:userOrder.totalPrice,
     subtotal:subtotal,
     currency:paymentDetails.currency,
     deliveryExpectedDate:userOrder.deliveryExpectedDate,
     discountAmount:userOrder.discountAmount,

    });
  } catch (error) {
    console.error('Error handling Razorpay success:', error);
    res.status(500).send({ error: error.message });
  }
};

// ---------------------------RAZORPAY----------------------------------------------







  module.exports = { getLogin, getProduct, getShop, getAbout, getBlog, getCart
    , getCheckout, getCollection, getComingSoon, getContact, getHome, getRegister, getWishlist, redirectHome,
      callbackUrl, postRegister, getUserProfile, logOut, userLogin, userRegister, handleVerification,
       postLogin, updateCartQuantity, postAddToWishlist, GetRemoveWishlist, postAddToCart, postRemoveCart, getClearCart,
       getProductCheckout, getOrderSuccess, postApplyCoupon, postRemoveCoupon, createCheckoutSession, editAddress,
       postAddAddress, removeAddress, getForgotpassword, postResetPassLink, resetPassword, getUpdatePass, postUpdatePass,
       getSearch, changeAccountDetails, miniCart, checkoutRazorpay, handleRazorpaySuccess  }