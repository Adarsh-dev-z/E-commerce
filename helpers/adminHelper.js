
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






}


