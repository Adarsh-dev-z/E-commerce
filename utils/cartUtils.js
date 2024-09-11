const Cart = require('../models/cart');
const Product = require('../models/product');

const addToCart = async (userId, itemsObject) => {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
        cart = new Cart({ user: userId, items: [] });
    }
   
    const items = itemsObject.items;

    if (Array.isArray(items) && items.length > 0) {
        for (let item of items) {
            const { product, quantity } = item;
            try {
                const productDetails = await Product.findById(product);
                if (productDetails) {
                    const itemIndex = cart.items.findIndex(cartItem => cartItem.product.toString() === product.toString());
                    if (itemIndex > -1) {
                        cart.items[itemIndex].quantity += quantity;
                        cart.items[itemIndex].totalPrice = productDetails.price * cart.items[itemIndex].quantity;
                    } else {
                        cart.items.push({
                            product: product,
                            quantity: quantity,
                            price: productDetails.price,
                            totalPrice: productDetails.price * quantity
                        });
                    }
                }
            } catch (error) {

            }
        }
    } else {

    }

    await cart.save();
    return cart;
};







module.exports = { addToCart };
