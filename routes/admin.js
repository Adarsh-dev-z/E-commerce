


var express = require('express');
var router = express.Router();
const multer = require('multer');
// const upload = multer({ dest: 'public/asset/images' });
const product = require('../models/product');
const Coupon = require('../models/coupon')
const { Users, DeletedUser } = require('../models/user');
const { AuthCheck, adminAuthCheck } = require('../middlewares/userAuthentication');
const Banner = require('../models/banner');
const Order = require('../models/order');
const bcrypt = require('bcrypt');
const { getAdmin } = require('../controller/adminController');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/asset/images');
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });
  const upload = multer({ storage });

router.get("/admin", adminAuthCheck, getAdmin );

router.post('/update-order-status', adminAuthCheck, async (req, res) => {
  const { orderId, status } = req.body;
  console.log(orderId, status);
  try {
    const order = await Order.findOne({ _id: orderId });
    if (!order) {
      return res.status(404).send('Order not found');
    }
    if (order.orderStatus === 'canceled') {
      return res.status(400).send({ error: 'Cannot change the status of a canceled order' });
    }

    const statusTransitions = {
      'pending': ['processing', 'canceled', 'shipped', 'delivered'],
      'processing': ['shipped', 'canceled', 'delivered'],
      'shipped': ['delivered', 'canceled'],
      'delivered': [],
      'canceled': []
    };

    if (!statusTransitions[order.orderStatus].includes(status)) {
      console.log(`Cannot change status from ${order.orderStatus} to ${status}`);
      return res.status(400).send({ error: `Cannot change status from ${order.orderStatus} to ${status}` });
    }

    order.orderStatus = status;

    if (status === 'canceled') {
      if (!order.refund) {
        const user = await Users.findOne({ _id: order.user });
        if (user) {
          user.walletAmount += parseFloat(order.totalPrice);
          order.refund = true;
          await user.save();
          await order.save();
          console.log('Order canceled, amount refunded');
        } else {
          console.log('User not found');
          return res.status(404).send('User not found');
        }
      } else {
        console.log('Refund status already updated');
      }
    }

    await order.save();
    res.status(200).send({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Failed to update order status:', error);
    res.status(500).send({ error: 'Failed to update order status' });
  }
});






router.get('/add-product', adminAuthCheck, (req, res) => {

  res.render('admin/add-product');
});

router.get('/edit-product', adminAuthCheck, async (req, res) => {
  try {
    console.log(req.query)
    const productId = req.query.id;
    console.log(productId)
    const selectedProduct = await product.findById(productId);
    if (!selectedProduct) {
      return res.render('admin/edit-product',{errorMesage:'Product not found'});
    }
    res.render('admin/edit-product', { product: selectedProduct });
  } catch (err) {
    console.log(err);
    res.status(500).send('Error fetching product details');
  }
});

// router.get('/admin-login', (req, res) => {
//   res.render('admin/login');
// });

router.get('/admin-products', adminAuthCheck, async (req, res) => {
  try {
    const products = await product.find({});
    res.render('admin/admin-products', { products });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching products');
  }
});

// router.post('/update-product', upload.single('productImage'), async (req, res) => {
    
//   try {
//     const productId = req.body.productId;
//     const updateProduct = {
//       name: req.body.name,
//       price: req.body.price,
//       description: req.body.description,
//       category: req.body.category,
//       expireDate: req.body.expire_date,
//       stock: req.body.stock,
//       productImage: `asset/images/${req.file.filename}`
//     };
//     const updatedProduct = await product.findByIdAndUpdate(productId, updateProduct, { new: true });
//     res.redirect('/admin-products');
//     console.log('Product updated:', updatedProduct);
//   } catch (err) {
//     console.log(err);
//     res.status(500).send('Error updating product');
//   }
// });



router.post('/update-product', adminAuthCheck, upload.array('productImage'), async (req, res) => {

  try {
    const productId = req.body.productId;
    
    let updateProduct = {
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      category: req.body.category,
      expireDate: req.body.expire_date,
      stock: req.body.stock
    };
    console.log(req.files)
    if (req.files.length > 0) {
      const productImages = req.files.map(file => `asset/images/${file.filename}`);
      updateProduct.productImage = productImages;
    } else {
      let existingProduct = await product.findById(productId);
      updateProduct.productImage = existingProduct.productImage;
    }
    if(!req.body.expire_date){
      const existingProduct2= await product.findById(productId);
      updateProduct.expireDate = existingProduct2.expireDate
    }
    const updatedProduct = await product.findByIdAndUpdate(productId, updateProduct, { new: true });
    res.redirect('/admin-products');
    console.log('Product updated:', updatedProduct);
  } catch (err) {
    console.log(err);
    res.status(500).send('Error updating product');
  }
});

router.get('/admin-users', adminAuthCheck, async (req, res) => {
  try {
    const searchTerm = req.query.search || ''; 
    const searchRegex = new RegExp(searchTerm, 'i'); 
    
    const users = await Users.find({
      role: 'user',
      username: searchRegex 
    });
    
    res.render('admin/admin-users', { 
      users,
      searchTerm 
    });
  } catch (err) {
    console.error(err, "error finding users");
    res.status(500).send('server error');
  }
});

router.get('/admin-accounts', (req, res) => {
  res.render('admin/accounts');
});

router.post('/add-product', adminAuthCheck, upload.array('productImage', []), async (req, res) => {
  try {
    console.log(req.body)
    const { name, brand, price, description, category, expireDate, stock } = req.body;
    // const productImage = req.file ? req.file.path : null;
    const productImage = req.files.map(file => `asset/images/${file.filename}`);
    const newProduct = new product({ 
        name, 
        brand,
        price, 
        description, 
        category, 
        expireDate, 
        stock, 
        productImage });
    const savedProduct = await newProduct.save();
    console.log('New product added:', savedProduct);
    res.redirect('/admin-products');
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).send('Error adding product');
  }
});


router.get('/delete-product/:id', adminAuthCheck, async (req, res)=>{
    const productId = req.params.id;
    try {
        await product.findByIdAndDelete(productId)
        res.redirect('/admin-products')
    } catch(err){
        console.log(err);
        res.status(500).send('error deleting product')
    }
})


router.post('/delete-products', adminAuthCheck, async (req, res) => {
  try {
    const productIds = req.body.productIds; 
    console.log(req.body);

    if (!Array.isArray(productIds)) {
      return res.status(400).send('Invalid request body');
    }

    const deletedproducts = await product.deleteMany({ _id: { $in: productIds } });

    res.status(200).send({ message: 'products deleted successfully', deletedproducts });
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred while deleting coupons');
  }
});


router.get('/block-user', adminAuthCheck, async (req, res) => {
  try {
    const userId = req.query.id;
    await Users.findByIdAndUpdate(userId, { isBlocked: true });
    res.redirect('/admin-users');
  } catch (err) {
    console.log(err, "error blocking user");
    res.status(500).send('Server error');
  }
});

router.get('/unblock-user', adminAuthCheck, async (req, res) => {
  try {
    const userId = req.query.id;
    await Users.findByIdAndUpdate(userId, { isBlocked: false });
    res.redirect('/admin-users');
  } catch (err) {
    console.log(err, "error unblocking user");
    res.status(500).send('Server error');
  }
});


router.get('/delete-user', adminAuthCheck, async (req, res) => {
  try {
      const userId = req.query.id;
      console.log(req.query)
      const deletingUser = await Users.findById(userId);
      
      if (deletingUser) {
        
         const softdelete = await DeletedUser.create({
              username: deletingUser.username,
              email: deletingUser.email,
              phone: deletingUser.phone,
              address: deletingUser.address,
              password: deletingUser.password
          });
          console.log(softdelete)
          await Users.findByIdAndDelete(userId);
          res.redirect('/admin-users');
      } else {
          res.status(404).send('User not found');
      }
  } catch (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
  }
});



//----------------------COUPON---------------------------------------

router.get('/add-coupon',adminAuthCheck, (req, res)=>{
  res.render('admin/add-coupon')
})

router.post('/add-coupon', adminAuthCheck, async(req, res)=>{
  const { code, discount, minPriceRange, maxPriceRange, usageCount, expireDate } = req.body;

  const coupon =await Coupon.findOne({code:code})
  console.log(req.body)
  
 

  const createCoupon = await Coupon.create({
    code:code,
    discount:discount,
    minPriceRange:minPriceRange,
    maxPriceRange:maxPriceRange,
    usageCount:usageCount,
    expireDate:expireDate
  })

  if(createCoupon){
    console.log("coupon created:"+ createCoupon)
    res.redirect('/admin-coupon')
  }


})



router.get('/admin-coupon', adminAuthCheck, async (req, res)=>{
  const coupon = await Coupon.find()
  res.render('admin/admin-coupon', {coupon})
})


router.get('/edit-coupon', adminAuthCheck, async (req, res)=>{
  const couponId = req.query.id
  
  const selectedCoupon = await Coupon.findById({_id: couponId})
  console.log(selectedCoupon)


  res.render("admin/edit-coupon", {coupon: selectedCoupon})
})

router.post('/edit-coupon/:id', adminAuthCheck, async(req, res)=>{
  try{



    let { code, discount, minPriceRange, maxPriceRange, usageCount, expireDate }= req.body;
    const couponId = req.params.id
    console.log(couponId)
    const coupon = await Coupon.findById({_id:couponId})
    if(!expireDate){
      expireDate = coupon.expireDate
    }
    const couponData = {
      code:code,
      discount:discount,
      minPriceRange:minPriceRange,
      maxPriceRange:maxPriceRange,
      usageCount:usageCount,
      expireDate:expireDate
    }
  
    const updateCoupon = await Coupon.findByIdAndUpdate(couponId, couponData, {new:true})
  console.log(updateCoupon)
  res.redirect('/admin-coupon')

  }catch(err){
    console.log(err)
    res.status(500).send("error updating coupon")
  }

})


router.get('/delete-coupon', adminAuthCheck, async(req, res)=>{
  try{

    
    const couponId = req.query.id;
    const deleteCoupon = await Coupon.findByIdAndDelete({_id:couponId})
    if(deleteCoupon){
      console.log("coupon deleted succesfully")
      res.redirect('/admin-coupon')
    }else{
      console.log("error deleting coupon")
    }
  }catch(err){
    console.log(err);
    res.status(500).send('server error, error deleting coupon')
  }

})

router.post('/delete-coupons', adminAuthCheck, async (req, res) => {
  try {
    const couponIds = req.body.couponIds; 
    console.log(req.body);

    if (!Array.isArray(couponIds)) {
      return res.status(400).send('Invalid request body');
    }

    const deletedCoupons = await Coupon.deleteMany({ _id: { $in: couponIds } });

    res.status(200).send({ message: 'Coupons deleted successfully', deletedCoupons });
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred while deleting coupons');
  }
});


//----------------------COUPON---------------------------------------

//----------------------BANNER---------------------------------------


router.get('/admin-banner', adminAuthCheck, async (req, res) => {
  try {
    const banner = await Banner.find();
    res.render('admin/admin-banner', { banner });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while fetching the banner.');
  }
});

router.get('/add-banner',adminAuthCheck, (req, res)=>{
  res.render('admin/add-banner')
})

router.post('/add-banner', adminAuthCheck, upload.array('bannerImage', []), async (req, res) => {
  try {
    const { title } = req.body;

    if (!title.trim()) {
      return res.status(400).render('admin/add-banner',{ error: 'Title is required.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).render('admin/add-banner',{ error: 'Banner image is required.' });
    }

    const bannerImage = req.files.map(file => `asset/images/${file.filename}`);
    console.log(title, bannerImage);

    const createBanner = await Banner.create({
      title: title,
      image: bannerImage
    });

    if (createBanner) {
      console.log("banner created:" + createBanner);
      res.redirect('/admin-banner');
    }
  } catch (error) {
    console.error(error);
    res.status(500).render('admin/add-banner',{ error: 'An error occurred while creating the banner.' });
  }
});

router.get('/edit-banner', adminAuthCheck, async (req, res) => {
  try {
    const bannerId = req.query.id;
    if (!bannerId) {
      return res.status(400).render('admin/edit-banner',{error:'Banner id is required'});
    }

    const selectedBanner = await Banner.findById(bannerId);
    if (!selectedBanner) {
      return res.status(404).render('admin/edit-banner', { error: 'Banner not found' });
    }

    res.render('admin/edit-banner', { banner:selectedBanner });
  } catch (err) {
    console.error(err);
    res.status(500).render('admin/edit-banner',{error:'Error fetching banner details'});
  }
});

router.post('/update-banner', adminAuthCheck, upload.array('bannerImage'), async (req, res) => {
  try {
    const bannerId = req.body.bannerId;
    if (!bannerId) {
      return res.status(400).render('admin/edit-banner', { error: 'Banner id is required' });
    }

    let updateBanner = {
      title: req.body.title
    };
    if(!updateBanner.title.trim()){
      return res.status(400).render('admin/edit-banner', { error: 'Title is required' });
    }

    if (req.files && req.files.length > 0) {
      const bannerImages = req.files.map(file => `asset/images/${file.filename}`);
      updateBanner.image = bannerImages;
    } else {
      const existingBanner = await Banner.findById(bannerId);
      if (!existingBanner) {
        return res.status(404).render('admin/edit-banner', { error: 'Banner not found' });
      }
      updateBanner.image = existingBanner.image;
    }

    const updatedBanner = await Banner.findByIdAndUpdate(bannerId, updateBanner, { new: true });
    if (!updatedBanner) {
      return res.status(500).render('admin/edit-banner', { error: 'Error updating banner' });
    }
    res.redirect('/admin-banner');
    console.log('banner updated:', updatedBanner);
  } catch (err) {
    console.error(err);
    res.status(500).render('admin/edit-banner', { error: 'Error updating banner' });
  }
});

router.get('/delete-banner/:id', adminAuthCheck, async(req, res)=>{
  const bannerId= req.params.id
  console.log(bannerId)
  const deleteBanner = await Banner.findByIdAndDelete(bannerId);
  if(deleteBanner){
    console.log('banner deleted')
    return res.redirect('/admin-banner')
  }else{
    console.log('error deleting banner')
    res.redirect('/admin-banner')
  }
})

// ...

router.post('/delete-banners', adminAuthCheck, async (req, res) => {
  try {
    const bannerIds = req.body.Ids; 
    console.log(req.body);

    if (!Array.isArray(bannerIds)) {
      return res.status(400).send('Invalid request body');
    }

    const deletedBanners = await Banner.deleteMany({ _id: { $in: bannerIds } });

    res.status(200).send({ message: 'Banners deleted successfully', deletedBanners });
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred while deleting banners');
  }
});

// ...


//----------------------BANNER---------------------------------------
router.get('/admin-profile', adminAuthCheck, async(req, res)=>{
  console.log(req.session.admin)
  const admin = await Users.findById(req.session.admin._id)
  res.render('admin/profile', {admin})
})


// router.post('/update-admin-profile', adminAuthCheck, async(req, res)=>{ 
//   const {username, email, password, confirmpassword} = req.body;
//   if(!username.trim() || !email.trim() || !password.trim() || !confirmpassword.trim()){
//     return res.render('admin/profile', {admin, error: 'All fields are required'});
//   }
//   const admin = await Users.findById(req.session.admin._id)
//   admin.name = username
//   admin.email = email
//   if(password===confirmpassword){
//     const hashedpassword = await bcrypt.hash(password, 10);
//     admin.password = hashedpassword;
//   }else{
//     return res.render('admin/profile', {admin, error: 'Passwords do not match'  })
//   }
//   await admin.save()
//   res.redirect('/admin-profile')
// })

router.post('/update-admin-profile', adminAuthCheck, async (req, res) => {
  try {
    const { username, email, password, confirmpassword } = req.body;

    if (!username.trim() || !email.trim() || !password.trim() || !confirmpassword.trim()) {
      return res.render('admin/profile', { admin: null, error: 'All fields are required' });
    }

    const adminId = req.session.admin._id;
    const admin = await Users.findById(adminId);
    if (!admin) {
      return res.render('admin/profile', { admin: null, error: 'Admin not found' });
    }

    admin.name = username;
    admin.email = email;
    if (password === confirmpassword) {
      const hashedPassword = await bcrypt.hash(password, 10);
      admin.password = hashedPassword;
    } else {
      return res.render('admin/profile', { admin, error: 'Passwords do not match' });
    }

    await admin.save();
    res.redirect('/admin-profile');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while updating admin profile');
  }
});

router.get('/admin-logout',(req, res) => {
  req.session.destroy();
  res.redirect('/login')
})

router.get('/admin-return', adminAuthCheck, async (req, res) => {
  try {
    const returnOrders = await Order.find({ return: 'available' })
      .populate({
        path: 'returnItems.product',
        select: 'name'
      })
      .populate('address');
      
    returnOrders.forEach(order => {
      order.returnItems.forEach(item => {
      });
    });
console.log('return orders',returnOrders)
    res.render('admin/admin-return', { returnOrders });
  } catch (err) {
    console.error('Error fetching return orders:', err);
    res.status(500).send('Internal Server Error');
  }
});


router.post('/update-return-status', adminAuthCheck, async (req, res) => {
  const { orderId, returnItemId, status } = req.body;

  // if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(returnItemId)) {
  //   return res.status(400).json({ error: 'Invalid order ID or return item ID' });
  // }

  try {
    const order = await Order.findById(orderId).populate('returnItems.product');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const returnItem = order.returnItems.id(returnItemId);
    if (!returnItem) {
      return res.status(404).json({ error: 'Return item not found' });
    }

    const statusTransitions = {
      'pending': ['processing', 'refunded'],
      'processing': ['refunded'],
      'refunded': []
    };

    if (!statusTransitions[returnItem.status].includes(status)) {
      return res.status(400).json({ error: `Cannot change status from ${returnItem.status} to ${status}` });
    }
    returnItem.status = status;
    if (status === 'refunded') {
      const user = await Users.findById(order.user);
      if (user) {
        user.walletAmount += returnItem.returnAmount;
        await user.save();
      } else {
        return res.status(404).json({ error: 'User not found' });
      }
    }

    await order.save();
    res.status(200).json({ message: 'Return item status updated successfully' });
  } catch (error) {
    console.error('Failed to update return item status:', error);
    res.status(500).json({ error: 'Failed to update return item status' });
  }
});


router.get('/admin-orders', adminAuthCheck, async (req, res) => {
  try {
    const sortOption = req.query.sort || 'date_desc';

    let sortCriteria;
    if (sortOption === 'date_asc') {
      sortCriteria = { deliveryExpectedDate: 1 };
    } else {
      sortCriteria = { deliveryExpectedDate: -1 };
    }

    const orders = await Order.find()
      .populate({
        path: 'user',
        select: 'username'
      })
      .populate({
        path: 'address',
        select: 'firstName lastName street city state postCode'
      })
      .populate({
        path: 'items.product',
        select: 'name'
      })
      .sort(sortCriteria);

    res.render('admin/admin-orders', { orders, sortOption });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).send('An error occurred while fetching orders');
  }
});



router.get('/admin-filter-orders',adminAuthCheck,async(req, res)=>{
  const {Min, Max} = req.query;
console.log('Min Max',Min, Max)
  const orders= await Order.find({totalPrice:{$gte:Min, $lte:Max}})
      .populate({
    path: 'user',
    select: 'username'}).populate({path: 'address',
    select: 'firstName lastName street city state postCode'}).populate({path: 'items.product',
    select: 'name'});
   console.log('--------------------------------',orders)
  res.render('admin/admin-orders',{orders})
})

module.exports = router;