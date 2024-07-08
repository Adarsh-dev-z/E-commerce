


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
const { getAdmin, updateOrderStatus, editProduct, adminProducts,
   adminUsers, deleteProduct, deleteProducts, blockUser, unblockUser,
    deleteUser, getAddCoupon, postAddCoupon, adminCoupon, getEditCoupon,
     postEditCoupon, deleteCoupon, deleteCoupons, getAddBanner, getEditBanner,
      deleteBanners, deleteBanner, adminProfile, updateAdminProfile, adminLogout,
       adminReturn, adminOrders, adminFilterOrders, getAddProduct, adminBanner,
        updateReturnStatus } = require('../controller/adminController');


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
router.post('/update-order-status', adminAuthCheck, updateOrderStatus);
router.get('/add-product', adminAuthCheck, getAddProduct);
router.get('/edit-product', adminAuthCheck, editProduct);
router.get('/admin-products', adminAuthCheck, adminProducts);


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
  } catch (err) {
    res.status(500).send('Error updating product');
  }
});

router.get('/admin-users', adminAuthCheck, adminUsers);
router.get('/admin-accounts', (req, res) => {
  res.render('admin/accounts');
});

router.post('/add-product', adminAuthCheck, upload.array('productImage', []), async (req, res) => {
  try {
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
    res.redirect('/admin-products');
  } catch (err) {
    res.status(500).send('Error adding product');
  }
});


router.get('/delete-product/:id', adminAuthCheck, deleteProduct)
router.post('/delete-products', adminAuthCheck, deleteProducts);
router.get('/block-user', adminAuthCheck, blockUser);
router.get('/unblock-user', adminAuthCheck, unblockUser);
router.get('/delete-user', adminAuthCheck, deleteUser);

//----------------------COUPON---------------------------------------

router.get('/add-coupon',adminAuthCheck, getAddCoupon)
router.post('/add-coupon', adminAuthCheck, postAddCoupon)
router.get('/admin-coupon', adminAuthCheck, adminCoupon)
router.get('/edit-coupon', adminAuthCheck, getEditCoupon)
router.post('/edit-coupon/:id', adminAuthCheck, postEditCoupon)
router.get('/delete-coupon', adminAuthCheck, deleteCoupon)
router.post('/delete-coupons', adminAuthCheck, deleteCoupons);

//----------------------COUPON---------------------------------------

//----------------------BANNER---------------------------------------

router.get('/admin-banner', adminAuthCheck, adminBanner);
router.get('/add-banner',adminAuthCheck, getAddBanner)

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

    const createBanner = await Banner.create({
      title: title,
      image: bannerImage
    });

    if (createBanner) {
      res.redirect('/admin-banner');
    }
  } catch (error) {
    res.status(500).render('admin/add-banner',{ error: 'An error occurred while creating the banner.' });
  }
});

router.get('/edit-banner', adminAuthCheck, getEditBanner);

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
  } catch (err) {
    res.status(500).render('admin/edit-banner', { error: 'Error updating banner' });
  }
});

router.get('/delete-banner/:id', adminAuthCheck, deleteBanner)
router.post('/delete-banners', adminAuthCheck, deleteBanners);

//----------------------BANNER---------------------------------------

router.get('/admin-profile', adminAuthCheck, adminProfile)



router.post('/update-admin-profile', adminAuthCheck, updateAdminProfile);
router.get('/admin-logout',adminLogout)
router.get('/admin-return', adminAuthCheck, adminReturn);
router.post('/update-return-status', adminAuthCheck, updateReturnStatus);
router.get('/admin-orders', adminAuthCheck, adminOrders);
router.get('/admin-filter-orders', adminAuthCheck, adminFilterOrders)

module.exports = router;