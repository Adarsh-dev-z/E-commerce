


var express = require('express');
var router = express.Router();
const multer = require('multer');
// const upload = multer({ dest: 'public/asset/images' });
const product = require('../models/product');
const Coupon = require('../models/coupon')
const { Users, DeletedUser } = require('../models/user');
const { AuthCheck, adminAuthCheck } = require('../middlewares/userAuthentication');
const Banner = require('../models/banner');
const bcrypt = require('bcrypt')
const Order = require('../models/order');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/asset/images');
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });
  const upload = multer({ storage });



  const getAdmin = async (req, res) => {
    try {

      const topCategory = await Order.aggregate([
        { $unwind: '$items' },
        {
            $lookup: {
                from: 'products',
                localField: 'items.product',
                foreignField: '_id',
                as: 'productDetails'
            }
        },
        { $unwind: '$productDetails' },
        {
            $group: {
                _id: '$productDetails.category',
                totalBought: { $sum: '$items.quantity' },
            }
        },
        { $sort: { totalBought: -1 } }
    ]);
    
      const currentYear = new Date().getFullYear();
      
      const chartOrders = await Order.find({
          datePlaced: {
              $gte: new Date(`${currentYear}-01-01`),
              $lt: new Date(`${currentYear + 1}-01-01`)
          }
      });

      const ordersPerMonth = new Array(12).fill(0);
      chartOrders.forEach(order => {
          const month = new Date(order.datePlaced).getMonth();
          ordersPerMonth[month] += 1;
      });
      
      const orders = await Order.find()
        .populate({
          path: 'user',
          select: 'username'}).populate({path: 'address',
          select: 'firstName lastName street city state postCode'}).populate({path: 'items.product',
          select: 'name'});
  
      const latestUpdates = await Order.find()
        .populate({
          path: 'user',
          select: 'username'}).populate({
          path: 'address',
          select: 'firstName lastName street city state postCode'}).populate({
          path: 'items.product',
          select: 'name'}).sort({ createdAt: 1 }).limit(10);
  
      const users = await Users.find()
        .sort({ createdAt: -1 })
        .limit(10);
  
  
  
      const totalOrders = await Order.countDocuments()
      const totalRevenue = await Order.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalPrice' }
          }
        }
      ]);
      const totalProducts = await product.countDocuments()
      const totalUsers = await Users.countDocuments()

      const topProducts = await Order.aggregate([
        { $unwind: '$items' },
        { $group: {
            _id: '$items.product',
            totalQuantity: { $sum: '$items.quantity' }
        }},
        { $sort: { totalQuantity: -1 } },
        { $limit: 4 },
        { $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'productDetails'
        }},
        { $unwind: '$productDetails' },
        { $project: {
            _id: 0,
            productName: '$productDetails.name',
            totalQuantity: 1
        }}
    ]);
  
      res.render('admin/index', { orders, users, latestUpdates, totalOrders, totalRevenue, totalProducts,topCategory,topProducts, totalUsers, 
                   ordersPerMonth: JSON.stringify(ordersPerMonth)

       });
    } catch (err) {
      res.status(500).send('Error fetching orders');
    }
  };
  




const updateOrderStatus = async (req, res) => {
  const { orderId, status } = req.body;
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
        } else {
          return res.status(404).send('User not found');
        }
      } else {
      }
    }

    await order.save();
    res.status(200).send({ message: 'Order status updated successfully' });
  } catch (error) {
    res.status(500).send({ error: 'Failed to update order status' });
  }
}

const editProduct = async (req, res) => {
  try {
    const productId = req.query.id;
    const selectedProduct = await product.findById(productId);
    if (!selectedProduct) {
      return res.render('admin/edit-product',{errorMesage:'Product not found'});
    }
    res.render('admin/edit-product', { product: selectedProduct });
  } catch (err) {
    res.status(500).send('Error fetching product details');
  }
}

const adminProducts = async (req, res) => {
  try {
      const categories = await product.distinct('category');
      const filterCategory = req.query.category;
      const searchQuery = req.query.search;
      let query = {};

      if (filterCategory) {
          query.category = filterCategory;
      }

      if (searchQuery) {
          query.$or = [
              { name: { $regex: searchQuery, $options: 'i' } },
              { brand: { $regex: searchQuery, $options: 'i' } },
          ];
      }

      const products = await product.find(query);
      res.render('admin/admin-products', { products, categories });
  } catch (err) {
      res.status(500).send('Error fetching products');
  }
};



const adminUsers = async (req, res) => {
  try {
    const searchTerm = req.query.search || ''; 
    const searchRegex = new RegExp(searchTerm, 'i'); 
    const isBlockedFilter = req.query.isBlocked ? req.query.isBlocked === 'true' : null;

    const filter = {
      role: 'user',
      username: searchRegex
    };

    if (isBlockedFilter !== null) {
      filter.isBlocked = isBlockedFilter;
    }

    const users = await Users.find(filter);

    res.render('admin/admin-users', { 
      users,
      searchTerm,
      isBlockedFilter: req.query.isBlocked 
    });
  } catch (err) {
    res.status(500).send('server error');
  }
};




const getAddProduct = (req, res) => {

  res.render('admin/add-product');
}


const deleteProduct=async (req, res)=>{
  const productId = req.params.id;
  try {
      await product.findByIdAndDelete(productId)
      res.redirect('/admin-products')
  } catch(err){
      res.status(500).send('error deleting product')
  }
}

const deleteProducts = async (req, res) => {
  try {
    const productIds = req.body.productIds; 

    if (!Array.isArray(productIds)) {
      return res.status(400).send('Invalid request body');
    }

    const deletedproducts = await product.deleteMany({ _id: { $in: productIds } });

    res.status(200).send({ message: 'products deleted successfully', deletedproducts });
  } catch (err) {
    res.status(500).send('An error occurred while deleting coupons');
  }
}

const blockUser = async (req, res) => {
  try {
    const userId = req.query.id;
    await Users.findByIdAndUpdate(userId, { isBlocked: true });
    res.redirect('/admin-users');
  } catch (err) {
    res.status(500).send('Server error');
  }
}

const unblockUser = async (req, res) => {
  try {
    const userId = req.query.id;
    await Users.findByIdAndUpdate(userId, { isBlocked: false });
    res.redirect('/admin-users');
  } catch (err) {
    res.status(500).send('Server error');
  }
}

const deleteUser = async (req, res) => {
  try {
      const userId = req.query.id;
      const deletingUser = await Users.findById(userId);
      
      if (deletingUser) {
        
         const softdelete = await DeletedUser.create({
              username: deletingUser.username,
              email: deletingUser.email,
              phone: deletingUser.phone,
              address: deletingUser.address,
              password: deletingUser.password
          });
          await Users.findByIdAndDelete(userId);
          res.redirect('/admin-users');
      } else {
          res.status(404).send('User not found');
      }
  } catch (err) {
      res.status(500).send('Internal Server Error');
  }
}


const getAddCoupon = (req, res)=>{
  res.render('admin/add-coupon')
}

const postAddCoupon = async (req, res) => {
  const { code, discount, minPriceRange, maxPriceRange, usageCount, expireDate } = req.body;

  if (!code || !discount || !minPriceRange || !maxPriceRange || !usageCount || !expireDate) {
    res.status(400).render('admin/add-coupon', { error: 'All fields are required' });
    return;
  }

  try {
    const existingCoupon = await Coupon.findOne({ code: code });
    if (existingCoupon) {
      res.status(409).render('admin/add-coupon', { error: 'Coupon already exists' });
      return;
    }

    const createCoupon = await Coupon.create({
      code: code,
      discount: discount,
      minPriceRange: minPriceRange,
      maxPriceRange: maxPriceRange,
      usageCount: usageCount,
      expireDate: expireDate
    });

    if (createCoupon) {
      res.redirect('/admin-coupon');
    } else {
      res.status(500).send('Failed to create coupon');
    }
  } catch (err) {
    res.status(500).send('Internal Server Error');
  }
}

const adminCoupon = async (req, res)=>{
  try {
    const coupon = await Coupon.find();
    res.render('admin/admin-coupon', {coupon});
  } catch (err) {
    res.status(500).render('admin/admin-coupon', { error: 'Failed to fetch coupons' });
  }
}


const getEditCoupon = async (req, res)=>{
  const couponId = req.query.id
  
  const selectedCoupon = await Coupon.findById({_id: couponId})


  res.render("admin/edit-coupon", {coupon: selectedCoupon})
}

const postEditCoupon = async(req, res)=>{
  try{



    let { code, discount, minPriceRange, maxPriceRange, usageCount, expireDate }= req.body;
    const couponId = req.params.id
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
  res.redirect('/admin-coupon')

  }catch(err){
    res.status(500).send("error updating coupon")
  }

}

const deleteCoupon = async(req, res)=>{
  try{

    
    const couponId = req.query.id;
    const deleteCoupon = await Coupon.findByIdAndDelete({_id:couponId})
    if(deleteCoupon){
      res.redirect('/admin-coupon')
    }else{
    }
  }catch(err){
    res.status(500).send('server error, error deleting coupon')
  }

}

const deleteCoupons= async (req, res) => {
  try {
    const couponIds = req.body.couponIds; 

    if (!Array.isArray(couponIds)) {
      return res.status(400).send('Invalid request body');
    }

    const deletedCoupons = await Coupon.deleteMany({ _id: { $in: couponIds } });

    res.status(200).send({ message: 'Coupons deleted successfully', deletedCoupons });
  } catch (err) {
    res.status(500).send('An error occurred while deleting coupons');
  }
}


const adminBanner = async (req, res) => {
  try {
    const banner = await Banner.find();
    res.render('admin/admin-banner', { banner });
  } catch (error) {
    res.status(500).send('An error occurred while fetching the banner.');
  }
}


const getAddBanner = (req, res)=>{
  res.render('admin/add-banner')
}

const getEditBanner = async (req, res) => {
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
    res.status(500).render('admin/edit-banner',{error:'Error fetching banner details'});
  }
}


const deleteBanner = async(req, res)=>{
  const bannerId= req.params.id
  const deleteBanner = await Banner.findByIdAndDelete(bannerId);
  if(deleteBanner){
    return res.redirect('/admin-banner')
  }else{
    res.redirect('/admin-banner')
  }
}


const deleteBanners = async (req, res) => {
  try {
    const bannerIds = req.body.Ids; 

    if (!Array.isArray(bannerIds)) {
      return res.status(400).send('Invalid request body');
    }

    const deletedBanners = await Banner.deleteMany({ _id: { $in: bannerIds } });

    res.status(200).send({ message: 'Banners deleted successfully', deletedBanners });
  } catch (err) {
    res.status(500).send('An error occurred while deleting banners');
  }
}


const adminProfile = async(req, res)=>{
  const admin = await Users.findById(req.session.admin._id)
  res.render('admin/profile', {admin})
}


const updateAdminProfile = async (req, res) => {
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

    admin.username = username;
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
    res.status(500).send('An error occurred while updating admin profile');
  }
}

const adminLogout = (req, res) => {
  req.session.destroy();
  res.redirect('/login')
}



const adminReturn = async (req, res) => {
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
    res.render('admin/admin-return', { returnOrders });
  } catch (err) {
    res.status(500).send('Internal Server Error');
  }
}



const updateReturnStatus = async (req, res) => {
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
    res.status(500).json({ error: 'Failed to update return item status' });
  }
}

const adminOrders = async (req, res) => {
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
    res.status(500).send('An error occurred while fetching orders');
  }
}

const adminFilterOrders = async(req, res)=>{
  const {Min, Max} = req.query;
  const orders= await Order.find({totalPrice:{$gte:Min, $lte:Max}})
      .populate({
    path: 'user',
    select: 'username'}).populate({path: 'address',
    select: 'firstName lastName street city state postCode'}).populate({path: 'items.product',
    select: 'name'});
  res.render('admin/admin-orders',{orders})
}







  
  module.exports = { getAdmin, updateOrderStatus, editProduct, adminProducts, adminUsers, deleteProduct,
    deleteProducts, blockUser, unblockUser, deleteUser, getAddCoupon, postAddCoupon, adminCoupon, getEditCoupon,
    postEditCoupon, deleteCoupon, deleteCoupons, adminBanner, getAddBanner, getEditBanner, deleteBanner, deleteBanners,
    adminProfile, updateAdminProfile, adminLogout, adminReturn, updateReturnStatus, adminOrders, adminFilterOrders, getAddProduct
   };
  