


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
    
    console.log(topCategory,'results')
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
  
      // console.log('Orders:', orders);
      // console.log('Latest Updates:', latestUpdates);
      // console.log('Users:', users);
  
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
    console.log(topProducts,'top products')
// console.log('total revenue:',totalRevenue)
// console.log('total products', totalUsers)
      res.render('admin/index', { orders, users, latestUpdates, totalOrders, totalRevenue, totalProducts,topCategory,topProducts, totalUsers, 
                   ordersPerMonth: JSON.stringify(ordersPerMonth)

       });
    } catch (err) {
      console.log('Error:', err);
      res.status(500).send('Error fetching orders');
    }
  };
  


// const getAdmin = async (req, res) => {
//   try {
//       const currentYear = new Date().getFullYear();
      
//       // Fetch orders for the current year
//       const orders = await Order.find({
//           datePlaced: {
//               $gte: new Date(`${currentYear}-01-01`),
//               $lt: new Date(`${currentYear + 1}-01-01`)
//           }
//       });

//       // Calculate orders per month
//       const ordersPerMonth = new Array(12).fill(0);
//       orders.forEach(order => {
//           const month = new Date(order.datePlaced).getMonth();
//           ordersPerMonth[month] += 1;
//       });

//       const totalOrders = await Order.countDocuments();
//       const totalRevenue = await Order.aggregate([
//           {
//               $group: {
//                   _id: null,
//                   totalRevenue: { $sum: '$totalPrice' }
//               }
//           }
//       ]);
//       const totalProducts = await product.countDocuments();
//       const totalUsers = await Users.countDocuments();

//       res.render('admin/index', { 
//           ordersPerMonth: JSON.stringify(ordersPerMonth), // Ensure ordersPerMonth is serialized to JSON
//           totalOrders, 
//           totalRevenue: totalRevenue[0]?.totalRevenue || 0, 
//           totalProducts, 
//           totalUsers 
//       });
//   } catch (err) {
//       console.log('Error:', err);
//       res.status(500).send('Error fetching orders');
//   }
// };



  
  module.exports = { getAdmin };
  