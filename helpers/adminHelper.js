
module.exports = {
    getTopCategory: async () => {
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
        return topCategory;
    },

    getChartOrders: async (currentYear) => {
        const chartOrders = await Order.find({
            datePlaced: {
                $gte: new Date(`${currentYear}-01-01`),
                $lt: new Date(`${currentYear + 1}-01-01`)
            }
        });
        return chartOrders;
    },

    getAllOrders: async () => {
        const orders = await Order.find()
            .populate({
                path: 'user',
                select: 'username'
            }).populate({
                path: 'address',
                select: 'firstName lastName street city state postCode'
            }).populate({
                path: 'items.product',
                select: 'name'
            });
        return orders;
    },


    getLatestUpdates: async () => {
        const latestUpdates = await Order.find()
            .populate({
                path: 'user',
                select: 'username'
            }).populate({
                path: 'address',
                select: 'firstName lastName street city state postCode'
            }).populate({
                path: 'items.product',
                select: 'name'
            }).sort({ createdAt: 1 }).limit(10);
        return latestUpdates;
    },

    
    getLatestUsers: async () => {
        const users = await Users.find()
            .sort({ createdAt: -1 })
            .limit(10);
        return users;
    },


    getTotalRevenue: async () => {
        const totalRevenue = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalPrice' }
                }
            }
        ]);
        return totalRevenue[0].totalRevenue;
    },


    getTopProducts: async () => {
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
        return topProducts;
    },


    getOrderById: async (orderId) => {
        const order = await Order.findOne({ _id: orderId });
        return order;
    },


    getProductById: async (productId) => {
        const selectedProduct = await product.findById(productId);
        return selectedProduct;
    },


    getProductsWithQSL: async (query, skip, limit) => {
        const products = await product.find(query)
            .skip(skip)
            .limit(limit);
        return products;
    },


    getUsersWithQSL: async (query, skip, limit) => {
        const users = await Users.find(query)
            .skip(skip)
            .limit(limit);
        return users;
    },



    getAllCategories: async () => {
        const categories = await Category.find();
        return categories;
    },



    
    deleteProductById: async (productId) => {
        await product.findByIdAndDelete(productId);
    },



    deleteProductsByIds: async (productIds) => {
        const deletedproducts = await product.deleteMany({ _id: { $in: productIds } });
        return deletedproducts;
    },


    
    blockUserById: async (userId) => {
        await Users.findByIdAndUpdate(userId, { isBlocked: true });
    },


    
    unblockUserById: async (userId) => {
        await Users.findByIdAndUpdate(userId, { isBlocked: false });
    },


    


    findUserById: async (userId) => {
        const deletingUser = await Users.findById(userId);
        return deletingUser;
    },


    
    softDeleteUser: async (deletingUser) => {
        const softdelete = await DeletedUser.create({
            username: deletingUser.username,
            email: deletingUser.email,
            phone: deletingUser.phone,
            address: deletingUser.address,
            password: deletingUser.password
        });
        return softdelete;
    },

    deleteUser: async (userId) => {
        await Users.findByIdAndDelete(userId);

    },


    checkCouponExistence: async (code) => {
        const existingCoupon = await Coupon.findOne({ code: code });
        return existingCoupon;
    },


    getAllCoupons: async () => {
        const coupon = await Coupon.find();
        return coupon;
    },


    findCouponById: async (couponId) => {
        const selectedCoupon = await Coupon.findById({_id: couponId});
        return selectedCoupon;
    },

    updateCoupon: async (couponId, couponData) => {
        const updateCoupon = await Coupon.findByIdAndUpdate(couponId, couponData, {new:true});
        return updateCoupon;
    },

    deleteCoupon: async (couponId) => {
        const deleteCoupon = await Coupon.findByIdAndDelete({_id:couponId});
        return deleteCoupon;
    },

    deleteMultipleCoupons: async (couponIds) => {
        const deletedCoupons = await Coupon.deleteMany({ _id: { $in: couponIds } });
        return deletedCoupons;
    },

    getAllBanners: async () => {
        const banner = await Banner.find();
        return banner;
    },

    findBannerById: async (bannerId) => {
        const selectedBanner = await Banner.findById(bannerId);
        return selectedBanner;
    },


    deleteBannerById: async (bannerId) => {
        const deleteBanner = await Banner.findByIdAndDelete(bannerId);
        return deleteBanner;
    },


    deleteMultipleBanners: async (bannerIds) => {
        const deletedBanners = await Banner.deleteMany({ _id: { $in: bannerIds } });
        return deletedBanners;
    },


    findAdminById: async (adminId) => {
        const admin = await Users.findById(adminId);
        return admin;
    },


    getAllReturnOrders: async () => {
        const returnOrders = await Order.find({ return: 'available' })
            .populate({
                path: 'returnItems.product',
                select: 'name'
            })
            .populate('address');
        return returnOrders;
    },


    findOrderWithReturnItemsPopulated: async (orderId) => {
        const order = await Order.findById(orderId).populate('returnItems.product');
        return order;
    },


    findOrders: async (query, sortCriteria, skip, limit) => {
        const orders = await Order.find(query)
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
            .sort(sortCriteria)
            .skip(skip)
            .limit(limit);

        return orders;
    },


    findOrdersByPriceRange: async (Min, Max) => {
        const orders = await Order.find({ totalPrice: { $gte: Min, $lte: Max } })
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
            });
        return orders;
    },









}


