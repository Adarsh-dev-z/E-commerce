// const passport=require('passport')
require('dotenv').config();
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
const userHelper = require("../helpers/userHelper");
const { addToCart } = require('../utils/cartUtils');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Coupon = require('../models/coupon');
const Razorpay = require('razorpay');
const product = require('../models/product');
const order = require('../models/order');
const coupon = require('../models/coupon');
const Reviews = require('../models/review');
const { setCacheControlHeaders } = require('../utils/cachClear');
const { log } = require('console');
const {transporter, generateToken} = require("../config/nodemailerConfig")


const getLogin = function(req, res) {
  setCacheControlHeaders(res);
  if(req.session.user){
    res.redirect('/home')
  }else{
    res.render('user/login');

  }
  };

const getProduct = async function(req, res) {
  try {
    const productId = req.query.id;
    if (!productId) {
      return res.status(400).send('Product ID is required');
    }

    const product = await userHelper.findProduct(productId);
    if (!product) {
      return res.status(404).send('Product not found');
    }

    const review = await userHelper.findProductReviews(product._id);
    const relatedProducts = await userHelper.findRelatedProducts(product)
    const isLoggedIn = Boolean(req.session.user);
    let order;
    if (req.session.user) {
      order = await Order.find({ user: req.session.user._id });
      const findProduct = order.find((orderItem) => orderItem.items.some((item) => item.product.toString() === productId));
      console.log(findProduct,'find product')
      let isProduct = true
      if(!findProduct){
        isProduct = false;
      }
      res.render('user/product', { product, relatedProducts, user: isLoggedIn, order, isProduct });
    }
    res.render('user/product', { product, relatedProducts, user: isLoggedIn, order });

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};



const getShop = async function(req, res) {
  setCacheControlHeaders(res);

  const getFilteredProduct = async () => {
    let excludeProducts = [0, 1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 24, 26, 30, 34, 40, 41, 23, 27, 28, 33, 35, 37];
    const allProducts = await Product.find();
    const filteredProducts = allProducts.filter((product, index) => !excludeProducts.includes(index));
    return filteredProducts;
  }

  try {
    let cart = { items: [] };
    let product = [];
    const { category, minPrice, maxPrice } = req.query;

    if (!category && !minPrice && !maxPrice) {
      product = await getFilteredProduct();
    } else if (minPrice && maxPrice) {
      product = await userHelper.findProductsByPriceRange(minPrice, maxPrice)
    } else if (category) {
      product = await userHelper.findProductsByCategory(category)
    }

    if (req.session.user) {
      cart = await userHelper.findCartBySessionUserId( req.session.user._id )
      const isLoggedIn = Boolean(req.session.user);

      res.render('user/shop', { Product: product, user: isLoggedIn, cart: cart || { items: [] } });
    } else {
      const guestCart = req.session.guestCart;

      if (guestCart) {
        const productIds = guestCart.items.map(item => item.product);
        const productsInCart = await userHelper.findProductsByIds(productIds);

        const updatedGuestCart = {
          items: guestCart.items.map(item => {
            const product = productsInCart.find(p => p._id.toString() === item.product.toString());
            return {
              ...item,
              product: product
            };
          })
        };

        res.render('user/shop', { Product: product, user: false, cart: updatedGuestCart });
      } else {
        res.render('user/shop', { Product: product, user: false, cart: { items: [] } });
      }
    }
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
};




  const getAbout = function(req, res) {
    res.render('user/about');
  };

  const getBlog = function(req, res) {
    res.render('user/blog');
  };

  const getCart = async function(req, res) {
    console.log('reached');
    try {
        if (req.session.user) {
            const userInSession = req.session.user;
            const userId = userInSession._id;
            const cart = await userHelper.findCartBySessionUserId(userId);

            if (!cart || !cart.items.length) {
                return res.render("user/cart", { cart: { items: [] }, cartTotal: 0 });
            }

            const cartTotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);
            console.log('logged cart:', cart);
            return res.render("user/cart", { cart, cartTotal });

        } else {
            let guestCart = req.session.guestCart || { items: [] };
            let cart = { items: [] };
            console.log('reached');
            console.log('guestcart', guestCart);

            if (!Array.isArray(guestCart.items)) {
                guestCart.items = [];
            }

            if (guestCart.items.length === 0) {
                return res.render("user/cart", { cart: { items: [] }, cartTotal: 0 });
            }

            const validProductIds = guestCart.items.filter(item => item.product).map(item => item.product.toString());
            const productDetails = await userHelper.findProductsByIds(validProductIds);

            cart.items = guestCart.items.map(item => {
                if (item.product) {
                    const productDetail = productDetails.find(product => product._id.toString() === item.product.toString());
                    if (productDetail) {
                        return {
                            product: {
                                _id: productDetail._id,
                                productImage: productDetail.productImage,
                                price: productDetail.price,
                            },
                            quantity: item.quantity,
                            totalPrice: item.quantity * productDetail.price
                        };
                    }
                }
                return null;
            }).filter(item => item !== null);

            const cartTotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);
            req.session.guestCart = { items: cart.items.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
                totalPrice: item.totalPrice
            })) };
            
            console.log('no log cart:', cart);
            return res.render("user/cart", { cart, cartTotal });
        }
    } catch (err) {
        console.error('Error fetching cart:', err);
        return res.status(500).send('Internal server error');
    }
};





const getMinicart = async function(req, res) {
  try {
    let cart;
    let cartTotal = 0;

    if (req.session.user) {
      const userId = req.session.user._id;
      cart = await userHelper.findCartBySessionUserId(userId)
      
      if (cart) {
        cartTotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);
      } else {
        cart = { items: [] };
      }
    } else if (req.session.guestCart) {
      cart = req.session.guestCart;

      const productIds = cart.items.map(item => item.product);


      const productsInCart = await userHelper.findProductsByIds(productIds);

      const updatedGuestCart = {
          items: cart.items.map(item => {
              const product = productsInCart.find(p => p._id.toString() === item.product.toString());
              return {
                  ...item,
                  product: product
              };
          })
      };


      cart = updatedGuestCart;

      cartTotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);
    } else {
      cart = { items: [] };
    }

    res.render('user/partials/minicart', { cart, cartTotal, layout: false });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

  const updateCartQuantity = async function(req, res) {
    if(req.session.user){
        const userInSession = req.session.user;
        const userId = userInSession._id;
        const { productId, action } = req.body;

        try {
            let cart = await userHelper.findCartBySessionUserId(userId)
            if (!cart) {
                return res.status(404).json({success: false, message: 'Cart not found' });
            }

            const productIndex = cart.items.findIndex(item => item.product._id.toString() === productId);
            if (productIndex === -1) {
                return res.status(404).json({ success:false, message: 'Product not found in cart' });
            }

            const product = cart.items[productIndex].product;
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }

            if (action === 'increase') {
                cart.items[productIndex].quantity += 1;
            } else if (action === 'decrease') {
                if (cart.items[productIndex].quantity > 1) {
                    cart.items[productIndex].quantity -= 1;
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
            res.status(500).json({ success: false, message: 'Server error' });
        }

    } else {
      const { productId, action } = req.body;
      console.log(req.body);
      let guestCart = req.session.guestCart;
      if (!productId || !action) {
          return res.status(400).json({ success: false, message: 'Invalid request parameters' });
      }
      const productIndex = guestCart.items.findIndex(item => item.product && item.product.toString() === productId);
      if (productIndex === -1) {
          return res.status(404).json({ success: false, message: 'Product not found in cart' });
      }
  
      const product = guestCart.items[productIndex].product;
      const findProduct = await userHelper.findProduct(product.toString())
      console.log('findProduct', findProduct);
      if (!findProduct) {
          return res.status(404).json({ success: false, message: 'Product not found' });
      }
  
      if (action === 'increase') {
          guestCart.items[productIndex].quantity += 1;
      } else if (action === 'decrease') {
          if (guestCart.items[productIndex].quantity > 1) {
              guestCart.items[productIndex].quantity -= 1;
          }
      }
      guestCart.items[productIndex].totalPrice = guestCart.items[productIndex].quantity * findProduct.price;

      const cartTotal = guestCart.items.reduce((total, item) => total + item.totalPrice, 0);
      req.session.guestCart = guestCart;
      res.json({
          success: true,
          quantity: guestCart.items[productIndex] ? guestCart.items[productIndex].quantity : 0,
          totalPrice: guestCart.items[productIndex] ? guestCart.items[productIndex].totalPrice : 0,
          cartTotal: cartTotal
      });
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


    
    
  const getHome = async (req, res) => {
    try {
        const [mainBanner, squareBanner, products, charecterAddition, womesProduct, mostpopular] = await Promise.all([
          userHelper.findMainBanner(),
          userHelper.findSquareBanner(),
          userHelper.findRecentProducts(9),
          userHelper.ProductsByCategory('Charecter Edition', 3),
          userHelper.ProductsByCategory('Most Popular', 3),
          userHelper.findLimitedProducts(3)
        ]);

        let cart = { items: [] };
        let isLoggedIn = false;
        let userName = '';
        let showWelcomeMessage = false;
        let cartTotal = 0

        if (req.session.user) {
            cart = await userHelper.findCartBySessionUserId(req.session.user._id)
            userName = req.session.user.username;
            isLoggedIn = true;

            if (!req.session.seenWelcomeMessage) {
                showWelcomeMessage = true;
                req.session.seenWelcomeMessage = true;
            }
            cartTotal = cart.items.reduce((acc, item) => acc + item.quantity * item.product.price, 0);

        } else {
            const guestCart = req.session.guestCart;

            if (guestCart) {
                console.log('gcart', guestCart);

                const productIds = guestCart.items.map(item => item.product);

                console.log('productIds', productIds);

                const productsInCart = await userHelper.findProductsInCart(productIds)

                console.log('productsInCart', productsInCart);

                const updatedGuestCart = {
                    items: guestCart.items.map(item => {
                        const product = productsInCart.find(p => p._id.toString() === item.product.toString());
                        return {
                            ...item,
                            product: product
                        };
                    })
                };

                console.log('updatedGuestCart', updatedGuestCart);

                cart = updatedGuestCart;
                 cartTotal = cart.items.reduce((acc, item)=> acc+ item.totalPrice, 0)
                 console.log('carttotal',cartTotal)
            }
        }

        res.render('user/home', {
            banner: mainBanner,
            squareBanner,
            products,
            charecterAddition,
            womesProduct,
            mostpopular,
            cart,
            userName,
            showWelcomeMessage,
            user: isLoggedIn,
            cartTotal
        });

    } catch (error) {
        console.error('Error fetching data for home page:', error);
        res.status(500).send('Internal Server Error');
    }
};



  const getRegister = function(req, res) {
    res.render('user/register');
  };

  const getWishlist = async function(req, res) {
    const userId = req.user._id;
    try{
      const wishlist = await userHelper.getwishlist(userId)
      res.render('user/wishlist',{wishlist: wishlist? wishlist.products: []});
    }catch(err){
      res.status(500).json({success: false, message: 'Server error'});
    }
  };

  const redirectHome = function(req, res) {
    res.redirect('/home');
  };

  const getUserProfile= async function(req, res){
  try{
    const userId = req.user._id
    const order = await userHelper.findOrderPopulateProduct(userId)
    const orderCount = await Order.countDocuments({user:userId})
    const user = await userHelper.findUser(userId)
    const pendingOrders = await Order.countDocuments({user:userId, orderStatus:"pending"});
    const canceledOrders = await Order.countDocuments({user:userId, orderStatus:"canceled"});
    const awaitingDeliveryOrders = await userHelper.awaitingDeliveryOrders(userId)

  const returnOrderItems = await userHelper.returnOrderItems(userId)
  
  const findReturnItems = returnOrderItems.flatMap(order => 
    order.returnItems.map(item => ({ ...item.toObject(), orderID: order.orderID }))
  );

  

  
    const address = await userHelper.getAddresses(userId)
    const wishlist = await userHelper.findWishlist(userId)

    res.render("user/userprofile",{
      order,
      orderCount,
      user,
      pendingOrders,
      address,
      wishlist,
      awaitingDeliveryOrders,
      findReturnItems,
      canceledOrders,
      razorpayKeyId:process.env.RAZORPAY_KEY_ID,
      
    })
  }catch(err){
    console.log(err)
  }

  }

  const postRegister = (req, res) => {
    try {
      console.log('reached       uiuiu')
      const registeredUser = req.user;
      req.session.user = registeredUser;
      req.session.loggedIn = true;
      res.redirect("/home");
    } catch (err) {
      console.error(err);
      res.status(500).render('user/register', { errorMessage: 'An error occurred during the login process. Please try again.' });
    }
  };


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
      } else if (req.session.admin) {
        redirectUrl = '/admin';
      }
  
      res.json({ success: true, clearGuestCart: true, redirectUrl });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
  
  
  
  const callbackUrl = (req, res)=>{
    res.redirect('/home')
  }

  const logOut= (req, res)=>{
    req.session.destroy()
    res.redirect("/home")
  }


  


  async function userRegister(req, res, next) {
    const { username, mobile, email, password } = req.body || {};

    try {

    } catch (error) {
        return res.status(400).json({ errorMessage: "Invalid guest cart data" });
    }

    if (!username?.trim() || !mobile?.trim() || !email?.trim() || !password?.trim()) {
        return res.status(400).json({ errorMessage: "All fields are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ errorMessage: "Invalid email address" });
    }

    if (mobile.length < 8 || mobile.length > 12 || !/^\d+$/.test(mobile)) {
        return res.status(400).json({ errorMessage: "Phone number length should be between 8 to 12 digits and numeric only" });
    }

    if (username.length < 3 || username.length > 20) {
        return res.status(400).json({ errorMessage: "Username should be 3 to 20 characters long" });
    }

    try {
        const dbEmail = await userHelper.findUserByEmail(email)
        if (dbEmail) {
            return res.status(400).json({ errorMessage: "User already exists, kindly login" });
        }

        const { token, expireTime } = generateToken();

        const verificationLink = `${req.protocol}://${req.get('host')}/verify?token=${token}`;
        await transporter.sendMail({
            from: APP_EMAIL,
            to: email,
            subject: 'Email Verification',
            html: `Hi, click <a href="${verificationLink}">here</a> to verify your email for Only Shoes.`
        });

        const hashedPass = await bcrypt.hash(password, 10);
        const data = {
            username,
            email,
            phone: mobile,
            password: hashedPass,
            verificationToken: token,
            tokenExpires: expireTime
        };
        const user = await createUser(data);

        return res.json({ clearGuestCart: true });
    } catch (err) {
        return res.status(500).json({ errorMessage: "An error occurred during registration. Please try again." });
    }
}





async function handleVerification(req, res) {
  const token = req.query.token;
  const user = await findToken(token);

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
  if(req.session.guestCart){
    await addToCart(user._id, req.session.guestCart)
  
  }

  return res.redirect('/home');
}




const postLogin = async (req, res) => {
  try {
    
    const { email, password } = req.body;

    const user = await userHelper.findRoleUser(email)
    const admin = await userHelper.findRoleAdmin(email)
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
console.log('guestcart in session', req.session.guestCart);
if(req.session.guestCart){
  await addToCart(currentUser._id, req.session.guestCart)

}

    // req.session.userId = user._id;
    req.session.role = currentUser.role;
    req.session.user = user ? currentUser : null;
    req.session.admin = admin ? currentUser : null;

    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Internal server error' });
      }

      let redirectUrl;
      if (req.session.user) {
        redirectUrl = '/home';
      } else if (req.session.admin) {
        redirectUrl = '/admin';
      }

      res.json({ success: true, clearGuestCart: true, redirectUrl, role: currentUser.role });
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const postAddToWishlist = async (req, res)=>{
  try {
      const productId= req.body.id;
      if(!productId){
          return res.status(400).json({ success:false, message:'product not found'});
      }else{
         const userId = req.user._id
         if(!userId){
            return res.status(400).json({ success:false, message:'please login to add to wishlist'});
         }

          let wishlist = await userHelper.getWishlist(userId)
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
      res.status(500).json({success:false, message:'internal server error'})
  }
}

const GetRemoveWishlist = async (req, res)=>{
  try{
      const productId = req.query.id;
  const userId = req.user._id
  const updateWishlist = await userHelper.updateWishlist(userId, productId)
  if(updateWishlist){
      res.json({success:true});

  }else{
      res.json({success:false});
  }
  }
  catch(err){
      res.status(500).json({success:false, message:'internal server error'})
  }
  
}
// -------------------------------------------------



const postAddToCart = async (req, res) => {
  if (req.session.user) {
      const product = req.query.productId;
      if (!product) {
          return res.status(400).send('Product ID is required');
      }

      const userInSession = req.session.user;
      const userId = userInSession._id;
      const items = [{ product, quantity: 1 }];
      const itemsToAdd = {items}
      try {
          await addToCart(userId, itemsToAdd);

          res.json({ success: true });
      } catch (error) {
          console.error('Error adding to cart for user:', error);
          res.status(500).send('Internal server error');
      }
  } else {
      const guestCartItems = req.body.guestCart || [];

      let guestCart = req.session.guestCart || { items: [] };
      req.session.guestCart = guestCart;

      try {
          const productIds = guestCartItems.map(p => p.productId);
          const findProducts = await userHelper.findProductsInCart(productIds)

          if (!findProducts || findProducts.length === 0) {
              return res.status(404).send('Products not found');
          }

          if (!Array.isArray(guestCart.items)) {
              guestCart.items = [];
          }

          guestCartItems.forEach(item => {
              const { productId, quantity } = item;
              const product = findProducts.find(p => p._id.toString() === productId);
              if (product) {
                  const itemIndex = guestCart.items.findIndex(cartItem => cartItem.product.toString() === productId);
                  if (itemIndex > -1) {
                      guestCart.items[itemIndex].quantity += quantity;
                      guestCart.items[itemIndex].totalPrice = guestCart.items[itemIndex].quantity * product.price;
                  } else {
                      guestCart.items.push({
                          product: productId,
                          quantity: quantity,
                          price: product.price,
                          totalPrice: product.price * quantity
                      });
                  }
              } else {
                  console.error(`Product with ID ${productId} not found`);
              }
          });

          await req.session.save();


          const cartTotal = guestCart.items.reduce((total, item) => total + item.totalPrice, 0);

          res.json({
              success: true,
              cartItems: guestCart.items,
              cartTotal: cartTotal,
              clearGuestCart: true
          });
      } catch (error) {
          console.error('Error adding to guest cart:', error);
          res.status(500).send('Internal server error');
      }
  }
};






const postRemoveCart = async (req, res) => {
  if(req.session.user){

    try {
        const productId = req.params.id;
        const userInSession = req.session.user
        const userId = userInSession._id;
  
        await userHelper.removeFromCart(userId, productId)
  
        res.status(200).json({ message: 'Product removed from cart' });
        
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while removing the product from the cart' });
    }
  }else{

    const productId = req.params.id
    if(req.session.guestCart && req.session.guestCart.items){
      req.session.guestCart.items = req.session.guestCart.items.filter((item)=> item.product.toString() !== productId)
    }
    res.status(200).json({ message: 'Product removed from cart' });


    
  }
}




const getClearCart = async (req, res) => {
  const userId = req.user._id;
  const clearCart = await userHelper.clearCart(userId)
  if(clearCart){
      res.redirect('/cart');
  }else{
      res.redirect('/cart');
  }
  
}



const getProductCheckout = async (req, res) => {
  setCacheControlHeaders(res);

  const userId = req.user?._id;
  if (!userId) {
    return res.redirect('/shop');
  }

  const cartId = req.query.id;
  const USER = await userHelper.findUser(userId);
  if (!USER) {
    return res.redirect('/shop');
  }

  const orderCount = await Order.countDocuments({ user: userId });
  const address = await userHelper.findAddresses(userId);

  const cart = await userHelper.getCart(userId);
  if (!cart || cart.items.length === 0) {
    return res.redirect('/shop');
  }
  let cartTotal = cart.items.reduce(
    (total, item) => total + (item.totalPrice || 0),
    0
  );
  let insufficientBalance = USER.walletAmount < cartTotal;
  let discount = 0;
  let appliedCoupon = null; 
  if(req.session.appliedCoupon){
    appliedCoupon = req.session.appliedCoupon;
    discount = appliedCoupon.discount;
    cartTotal = cartTotal - discount;
    insufficientBalance = USER.walletAmount < cartTotal;
  }

  const coupon = await userHelper.findCouponBasedOnPrice(cartTotal);
  res.render('user/checkout', {
    cart,
    cartTotal,
    coupon,
    orderCount,
    USER,
    address,
    insufficientBalance,
    appliedCoupon,
  });
};

const getOrderSuccess = async(req, res)=>{
  
  const sessionId = req.query.session_id;
  const userId = req.user._id

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['total_details.breakdown.discounts']
  })

  const address = await userHelper.getAddressById(session.metadata.addressId);
  const userCart = await userHelper.getCart(userId)
  if(!userCart){
      return res.status(400).redirect('/home');
  }
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
      if (discount) {
          // couponCode = discount.coupon.id; 
          discountAmount = discount.amount / 100; 
          order.discountAmount =discountAmount;
          await order.save();
          
      }
  }


  if(!order.stockUpdated){
      try{
          for(const item of order.items){
              const product = await userHelper.findProductById(item.product._id)
              if(product){
                  product.stock -=item.quantity;

                  await product.save();
              }
          }
          order.stockUpdated=true;
          await order.save();
      }catch (err){
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
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% clear cart  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
          // const clearCart = await Cart.findOneAndDelete({user:userId})
 const clearCart = await userHelper.clearCart(userId)

          if(clearCart){

          }else{
            console.log('error updating cart')
          }
          

          const findUser = await User.findOne({ _id: userId });

          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.APP_EMAIL,
              pass: process.env.APP_PASSWORD
            }
          });
      
          const mailOptions = {
            from: process.env.APP_EMAIL,
            to: findUser.email,
            subject: 'Order Confirmation - Your Order has been Placed!',
            html: `
              <div style="font-family: Arial, sans-serif; color: #333;">
                <div style="background-color: #f8f8f8; padding: 20px;">
                  <h1 style="color: #4CAF50;">Order Confirmation</h1>
                  <p>Hi <strong>${findUser.username}</strong>,</p>
                  <p>Thank you for shopping with us! Your order has been successfully placed. Here are your order details:</p>
                </div>
                <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd;">
                  <h2 style="color: #333;">Order Summary</h2>
                  <p><strong>Order ID:</strong> ${order.orderID}</p>
                  <p><strong>Total Amount:</strong> $${(session.amount_total / 100).toFixed(2)}</p>
                  ${discountAmount ? `<p><strong>Discount Applied:</strong> -$${discountAmount.toFixed(2)}</p>` : ''}
                  <p><strong>Expected Delivery Date:</strong> ${formatedDate}</p>
                </div>
                <div style="background-color: #f8f8f8; padding: 20px;">
                  <h2 style="color: #333;">Delivery Address</h2>
                  <p>${address.street}, ${address.city}, ${address.state}, ${address.postCode}, ${address.address}</p>
                </div>
                <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd;">
                  <h2 style="color: #333;">Items in Your Order</h2>
                  <ul>
                    ${order.items.map(item => `
                      <li>
                        <p><strong>${item.product.name}</strong></p>
                        <p>Quantity: ${item.quantity}</p>
                        <p>Price: $${(item.product.price).toFixed(2)}</p>
                      </li>
                    `).join('')}
                  </ul>
                </div>
                <div style="background-color: #f8f8f8; padding: 20px; text-align: center;">
                  <p>We hope you enjoy your purchase! If you have any questions, feel free to <a href="mailto:${'adarsh7013a@gmail.com'}" style="color: #4CAF50;">contact us</a>.</p>
                  <p>Best regards,</p>
                  <p>Your Company Name</p>
                </div>
              </div>
            `
          };
      
          await transporter.sendMail(mailOptions);
          
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
  const coupon = await userHelper.findCouponByCode(couponCode)

  if (!coupon) {
      return res.json({ success: false, message: 'Invalid coupon code' });
  }

  const userId = req.user._id;
  const user= await userHelper.findUser(userId)
  const cart = await userHelper.getCart(userId)

  if (!cart || !cart.items || cart.items.length === 0) {
      return res.json({ success: false, message: 'Cart is empty.' });
  }

  const cartTotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);
  req.session.appliedCoupon = {couponCode:coupon.code,discount:coupon.discount}
  const discountedTotal = cartTotal - coupon.discount;
  const insufficientBalance = user.walletAmount < discountedTotal;

  res.json({ success: true, discountedTotal, discount: coupon.discount, insufficientBalance });
}

const postRemoveCoupon = async (req, res) => {
  if (!req.session.appliedCoupon) {
      return res.json({ success: false, message: 'No coupon applied.' });
  }

  delete req.session.appliedCoupon;

  const userId = req.user._id;
  const user= await userHelper.findUser(userId)
  const cart = await userHelper.getCart(userId )

  if (!cart || !cart.items || cart.items.length === 0) {
      return res.json({ success: false, message: 'Cart is empty.' });
  }

  const cartTotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);
  const insufficientBalance = user.walletAmount < cartTotal;

  res.json({ success: true, newTotal: cartTotal, insufficientBalance });
}




const createCheckoutSession = async (req, res) => {
  const userId = req.user._id
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

      const cart = await userHelper.getCart(userId)

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
            ...(req.session.couponDiscount ? { couponDiscount: req.session.couponDiscount.toString() } : {})

          },
          success_url: `${req.headers.origin}/userOrder-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${req.headers.origin}/product-checkout`,
          expand: ['total_details.breakdown.discounts'],
      };
     
      
      if (req.session.couponDiscount && req.session.couponDiscount.length > 0) {
          const totalDiscount = req.session.couponDiscount.reduce((acc, item) => acc + item.discount, 0);
          sessionData.discounts = [{
              coupon: req.session.couponDiscount[0].couponCode
          }];
         
      }

      const session = await stripe.checkout.sessions.create(sessionData);
      // order.items = cart.items;
      // order.stripeSessionId = session.id;
      // await order.save();

      req.session.couponDiscount = [];
      res.json({ url: session.url });
     
  } catch (error) {
      res.status(500).json({ error: 'An error occurred while creating the checkout session.' });
  }
}


const getAddresses = async (req, res) => {
  try {
      const userId = req.user._id;
      const addresses = await userHelper.findAddresses(userId)
      res.status(200).json({ success: true, addresses });
  } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Error fetching addresses' });
  }
};


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

      const findAddress = await userHelper.updateAddress(addressId,
          firstname,
          lastname,
          email,
          telephone,
          company,
          address,
          apartment,
          city,
          postcode,
          state,
          street
  )
  if (!findAddress) {
      return res.status(404).json({ success: false, message: 'Address not found' });
  }
   res.json({ success: true, message: 'Address updated successfully'});
  }catch(err){
      return res.status(500).json({success:false, message:'internal server error'})
  }
}

const postAddAddress = async(req, res)=>{
  const userId = req.user._id;
  const { firstname,lastname, email, telephone, company, address, apartment, city, postcode, street, state } = req.body
  if(!firstname.trim() || !lastname.trim() || !email.trim() || !telephone.trim() || !company.trim() || !address.trim() || !city.trim() || !postcode.trim() || !state.trim()){
      return res.status(400).json({success:false, message:'Please provide all required fields'})
  }
  if (!firstname || !lastname || !/^[a-zA-Z]+$/.test(firstname) || !/^[a-zA-Z]+$/.test(lastname)) {
      return res.status(400).json({success:false, message:'Please provide valid names'});
  }
  if (!telephone || !/^\d+$/.test(telephone)) {
      return res.status(400).json({success:false, message:'Please provide a valid mobile number'});
  }
  
  try{

      const newAddress = await userHelper.addAddress(
          userId,
          firstname,
          lastname,
          email,
          telephone,
          company,
          address,
          apartment,
          city,
          postcode,
          state,
          street
  
      )
      res.status(200).json({success:true, message:'address added successfully'})
  }catch(err){
      return res.status(500).json({success:false, message:'error adding address'})
  }
}


const removeAddress = async (req, res) => {
  try {
      const addressId = req.params.id;
      const address = await userHelper.removeAddress(addressId)
      if (address) {
          res.json({ success: true, message: 'Address deleted successfully' });
      } else {
          res.json({ success: false, message: 'Address not found' });
      }
  } catch (err) {
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
      const user = await userHelper.findUserByEmail(userEmail)
      if(!user){
          return res.render('user/forgot-password', {emailNotFound:true})
      }
      const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.APP_EMAIL,
            pass: process.env.APP_PASSWORD 
          }
        });
  
       
        const {token, expireTime}= generateToken();
        user.tokenExpires =expireTime
        user.verificationToken =token;
        await user.save()
  
        const verificationLink = `${process.env.DURL}/resetpass?token=${token}`;
        transporter.sendMail({
          from: process.env.APP_EMAIL,
          to: userEmail,
          subject: 'Email Verification',
          html: `Hi, click <a href="${verificationLink}">here</a> to verify your email.`
          })

          res.render('user/forgot-password', {emailSent:true})
          async (err)=>{
              if(err){
                  return res.status(500).send('errror sending link')
              }else{
                  res.send('we sent a link to reset your password.')
              }
          }
        
  }catch(err){
      return res.status(500).send('error resetting your password')
  }

}


const resetPassword = async function resetPassword(req, res) {
  const token = req.query.token;
  const user = await userHelper.findUserByToken(token)

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
  return res.redirect('/update-password');
}


const getUpdatePass = (req, res)=>{
  res.render("user/update-password")
}


const postUpdatePass = async(req, res)=>{
  try {
    const {password, confirmpassword} = req.body;
    if (!password.trim() || !confirmpassword.trim()) {
      return res.render('user/update-password', {errorMessage:'All fields are required'});
    }

    if (password !== confirmpassword) {
      return res.render('user/update-password', {errorMessage:'Passwords do not match'});
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const email = req.session.email;
    if (!email) {
      return res.render('user/update-password', {errorMessage:'Email not found in session'});
    }

    const user = await userHelper.updateUserPassword(email,hashedPassword);
    if (!user) {
      return res.render('user/update-password', {errorMessage:'User not found'});
    }

    res.redirect('/login')
  } catch (err) {
    return res.render('user/update-password', {errorMessage:'Error resetting password'});
  }
}

const getSearch = async(req, res)=>{

  const keyword = req.query.keyword
  const product = await userHelper.searchProduct(keyword)
  res.render('user/shop',{Product:product})
}




const changeAccountDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      throw new Error('User ID is missing');
    }

    const findUser = await userHelper.findUser(userId)
    if (!findUser) {
      throw new Error('User not found');
    }

    if (!req.body) {
      throw new Error('Request body is missing');
    }

    const { username, mobile, currentpassword, newpassword, confirmpassword } = req.body;

    
    if (!username || !mobile || !currentpassword || !newpassword || !confirmpassword) {
      throw new Error('All fields are required');
    }

    if (username.trim().length < 3 || username.trim().length > 20) {
      throw new Error('Username must be between 3 and 20 characters');
    }

    if (mobile.trim().length < 8 || mobile.trim().length > 12) {
      throw new Error('Mobile number must be between 8 and 12 characters');
    }

    if (!/^\d{8,12}$/.test(mobile.trim())) {
      throw new Error('Mobile number must contain only digits and be between 8 and 12 characters');
    }

    
    if (!/^(?=.*[a-z])(?=.*\d).{8,}$/.test(newpassword)) {
      throw new Error('Password must contain at least 8 characters, including a small letter and a number');
    }

    const user = await userHelper.findUser(userId)
    if (!user) {
      throw new Error('User with the specified email not found');
    }

    const passwordMatch = await bcrypt.compare(currentpassword, findUser.password);
    if (!passwordMatch) {
      throw new Error('Current password is incorrect');
    }

    if (newpassword !== confirmpassword) {
      throw new Error('New password does not match confirm password');
    }

    const hashedPassword = await bcrypt.hash(newpassword, 10);

    const updateData = {
      username: username,
      // email: email,
      mobile: mobile,
      password: hashedPassword
    };

    const updatedUser = await userHelper.updateUserDetails(userId, updateData)
    if (!updatedUser) {
      throw new Error('Error updating user details');
    }

    return res.json({ success: true, message: 'User details updated' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
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
    const cart = await userHelper.getCart(userId)
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
      amount: newCartTotal * 100, 
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
      callback_url: `/razorpay-success`,  
    };
    
     
       
    
    res.json({ razorpayOptions });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};



const handleRazorpaySuccess = async (req, res) => {

  try {
    const userId = req.user._id;

    const cart = await userHelper.getCart(userId)
    if (!cart || !cart.items.length) {
      return res.status(400).redirect('/home');
    }

    const couponDiscount = 0;
    const newCartTotal = cart.items.reduce((total, item) => total + item.totalPrice, 0) - couponDiscount;

    const { razorpay_payment_id, razorpay_order_id } = req.body;
    const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);

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

    await userOrder.save();


    await Promise.all(cart.items.map(async (item) => {
      const product = item.product;
      product.stock -= item.quantity;
      if (product.stock <= 0) {
        product.isOutOfStock = true;
      }
      await product.save();
    }));

    userOrder.stockUpdated = true;
    await userOrder.save();
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();
    // %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
    const userAddress = await Address.findById(paymentDetails.notes.address);

    const subtotal=parseFloat(userOrder.totalPrice)+parseFloat(userOrder.discountAmount)

    const findUser = await userHelper.findUser(userId)
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, 
      auth: {
        user: process.env.APP_EMAIL,
        pass: process.env.APP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: process.env.APP_EMAIL,
      to: findUser.email,
      subject: 'Order Confirmation - Your Order has been Placed!',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <div style="background-color: #f8f8f8; padding: 20px;">
            <h1 style="color: #4CAF50;">Order Confirmation</h1>
            <p>Hi <strong>${findUser.username}</strong>,</p>
            <p>Thank you for shopping with us! Your order has been successfully placed. Here are your order details:</p>
          </div>
          <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd;">
            <h2 style="color: #333;">Order Summary</h2>
            <p><strong>Order ID:</strong> ${userOrder.orderID}</p>
            <p><strong>Total Amount:</strong> $${(userOrder.totalPrice).toFixed(2)}</p>
            ${userOrder.discountAmount ? `<p><strong>Discount Applied:</strong> -$${userOrder.discountAmount.toFixed}</p>` : ''}
            <p><strong>Expected Delivery Date:</strong> ${formatedDate}</p>
          </div>
          <div style="background-color: #f8f8f8; padding: 20px;">
            <h2 style="color: #333;">Delivery Address</h2>
            <p>${userAddress.street}, ${userAddress.city}, ${userAddress.state}, ${userAddress.postCode}, ${userAddress.address}</p>
          </div>
          <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd;">
            <h2 style="color: #333;">Items in Your Order</h2>
            <ul>
              ${userOrder.items.map(item => `
                <li>
                  <p><strong>${item.product.name}</strong></p>
                  <p>Quantity: ${item.quantity}</p>
                  <p>Price: $${(item.product.price).toFixed(2)}</p>
                </li>
              `).join('')}
            </ul>
          </div>
          <div style="background-color: #f8f8f8; padding: 20px; text-align: center;">
            <p>We hope you enjoy your purchase! If you have any questions, feel free to <a href="mailto:${'adarsh7013a@gmail.com'}" style="color: #4CAF50;">contact us</a>.</p>
            <p>Best regards,</p>
            <p>Your Company Name</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);



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
    res.status(500).send({ error: error.message });
  }
};

// ---------------------------RAZORPAY----------------------------------------------


const getShopByCategory = async (req, res) => {
  const category = req.query.category;
  if (!category) {
    return res.status(400).send('Category is required');
  }
  try {
    const products = await userHelper.findProductsByCategory(category)
    return res.render('user/shop', { Product: products });
  } catch (error) {
    return res.status(500).send('Internal Server Error');
  }
};


const renderRazorpayOrderSuccess = (req, res) => { 
  setCacheControlHeaders(res);

res.render('user/order-success');
}

const getCancelOrder = async (req, res) => {
  const userId = req.user._id;
  const orderId = req.params.id;
  try {
      const order = await Order.findOneAndUpdate(
          { _id: orderId },
          { $set: { orderStatus: 'canceled' } },
          { new: true }
        );
      if (order) {
          const user = await userHelper.findUser(userId)
          
          if(order.refund===false){
            user.walletAmount = parseFloat(order.totalPrice) + user.walletAmount;
            order.refund = true;
          }
          await user.save();
          await order.save();
          res.json({ success: true,message:'Order canceled', order });
      } else {
          res.json({ success: false,message:'Order not found'});
      }
  } catch (error) {
      res.json({ success: false, message: 'An error occurred', error });
  }
}


const returnItems = async (req, res) => {
  try {
    const { productId, quantity, reason, orderId } = req.query;

    if (!productId || !quantity || !orderId) {
      return res.status(400).send('Missing required query parameters');
    }

    const order = await userHelper.findOrderWithOrderId(orderId)
    if (!order) {
      return res.status(404).send('Order not found');
    }

    const totalQuantity = order.items
      .filter(item => item.product._id.toString() === productId)
      .reduce((acc, item) => acc + item.quantity, 0);

    const totalReturnQuantity = order.returnItems
      .filter(item => item.product.toString() === productId)
      .reduce((acc, item) => acc + item.quantity, 0) + Number(quantity);


    if (totalReturnQuantity > totalQuantity) {
      return res.status(400).send('You cannot return more products than ordered');
    }

   
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
    order.return = 'available'
    await order.save();
    

    const quantityInItems = order.items.reduce((acc, item) => {
      return acc + item.quantity;
    }, 0);
    const quantityInReturnItems = order.returnItems.reduce((acc,item)=>{
      return acc+item.quantity;
    }, 0)

    if(quantityInItems===quantityInReturnItems){
      order.completeOrderReturn = true;
      await order.save();
    }
    


    res.redirect(`/view-order?id=${orderId}`);
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
}


const returnEntireOrder = async (req, res) => {
  try {
    const orderId = req.query.id;
    const reason = req.query.reason;
    const order = await userHelper.findOrderWithOrderId(orderId);

    if (!order) {
      return res.status(404).send('Order not found');
    }

    const adjustedItems = order.items.map(item => {
      const returnItem = order.returnItems.find(returnItem => returnItem.product.toString() === item.product._id.toString());

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
    
    for (const item of adjustedItems) {
      if (item.quantity < 0) {
        return res.status(400).send('Invalid return request: more items returned than ordered');
      }

      const existingReturnItem = order.returnItems.find(returnItem => returnItem.product.toString() === item.product._id.toString());
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
    order.return = 'available'
    // const maxQuantityReached = true
    await order.save();

    res.redirect(`/view-order?id=${orderId}`);
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
}

const renderOrderSuccess = (req, res) => {
  setCacheControlHeaders(res);

  res.render('user/order-success');
}

const postReview = async (req, res) => {
  const userId = req.user._id
  const { product, user, comment, title, author } = req.body;
  const rating = Number(req.body.rating);
  try{

    const review = await userHelper.createReview({ userId, user, product, rating, comment, title, author });
    res.status(201).json(review);
  }catch(err){

  }
  
}


const getReviews = async (req, res) => {
  try {
      const reviews = await userHelper.getReviews(req.params.productId);
      res.json(reviews);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
}


const cartCount = async (req, res) => {
  try {
    if (req.session.user) {
      const userInSession = req.session.user;
      const userId = userInSession._id;
      const cart = await userHelper.getCartCount(userId)
      if (!cart || !cart.items) {
        return res.json({ count: 0 });
      }
      const count = cart.items.length;
      return res.json({ count });
    } else {
      const guestCart = req.session.guestCart || { items: [] };
      const guestCartCount = guestCart.items.length;
      console.log('Guest Cart:', guestCart, 'Count:', guestCartCount);
      return res.json({ count: guestCartCount });
    }
  } catch (error) {
    console.error('Error in cartCount:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};




const viewOrder = async (req, res) => {
  const orderId = req.query.id;
  if (!orderId) {
    return res.status(400).send('Missing required query parameters');
  }

  const order = await userHelper.findOrderWithOrderId(orderId)
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
}



const walletCheckout = async (req, res) => {
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

  const existingAddress = await userHelper.findExistingAddress(
      userId,
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
  );


  let userAddress;
  if (existingAddress) {
      userAddress = existingAddress;
  } else {
      const newAddress = new Address({
          user: userId,
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
      userAddress = await newAddress.save();
  }

  try {
      const cart = await userHelper.getCart(userId)
      if (!cart || !cart.items || cart.items.length === 0) {
          return res.json({ success: false, message: 'Cart is empty.' });
      }

      const cartTotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);
      let appliedCoupon = 0;

      if (req.session.appliedCoupon) {
          let availableCoupon=req.session.appliedCoupon;
              appliedCoupon += availableCoupon.discount;
          
      }

      const newCartTotal = cartTotal - appliedCoupon;
      delete req.session.appliedCoupon

const user = await userHelper.findUser(userId);

     user.walletAmount = user.walletAmount - newCartTotal;
     await user.save();
     const formatedDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
     console.log('reached 6')

      const userOrder = new Order({
          user: userId,
          address: userAddress._id,
          orderID: `ORDER-${Date.now()}`,
          payment: 'wallet',
          items: cart.items,
          totalPrice: newCartTotal,
          discountAmount: appliedCoupon,
          deliveryExpectedDate: formatedDate,
      });

      await userOrder.save();

      await Promise.all(cart.items.map(async (item) => {
          const product = item.product;
          product.stock -= item.quantity;
          await product.save();
      }));

      userOrder.stockUpdated = true;
      await userOrder.save();
      cart.items = [];
      cart.totalPrice = 0;
      await cart.save();

      res.json({ success: true, orderid:userOrder.id });
  } catch (error) {
      res.status(500).send({ error: error.message });
  }
};

const walletOrderSuccess = async(req, res) => {

  setCacheControlHeaders(res);
  const orderid = req.query.orderid;

  if (!orderid) {
    return res.status(400).send({ error: 'Order ID is required' });
  }

  const order = await userHelper.getOrderDetailsById(orderid);
  if (!order) {
    return res.status(404).send({ error: 'Order not found' });
  }

  
  const subtotal = order.totalPrice + parseInt(order.discountAmount);
  
  res.render('user/order-success', {order:order,
    address: order.address,
    items:order.items,
    total:order.totalPrice,
   subtotal:subtotal,
   currency:'inr',
   deliveryExpectedDate:order.deliveryExpectedDate,
   discountAmount:order.discountAmount,});
}



  module.exports = { getLogin, getProduct, getShop, getAbout, getBlog, getCart
    , getCheckout, getCollection, getComingSoon, getContact, getHome, getRegister, getWishlist, redirectHome,
      callbackUrl, postRegister, getUserProfile, logOut, userLogin, userRegister, handleVerification,
       postLogin, updateCartQuantity, postAddToWishlist, GetRemoveWishlist, postAddToCart, postRemoveCart, getClearCart,
       getProductCheckout, getOrderSuccess, postApplyCoupon, postRemoveCoupon, createCheckoutSession, editAddress,
       postAddAddress, removeAddress, getForgotpassword, postResetPassLink, resetPassword, getUpdatePass, postUpdatePass,
       getSearch, changeAccountDetails, getMinicart, checkoutRazorpay, handleRazorpaySuccess, getShopByCategory,
       getCancelOrder, returnItems, returnEntireOrder, postReview, getReviews, cartCount, viewOrder, walletCheckout,
        renderOrderSuccess, renderRazorpayOrderSuccess, walletOrderSuccess, getAddresses  }