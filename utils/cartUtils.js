const Cart = require('../models/cart');
const Product = require('../models/product');

const addToCart = async (userId, itemsObject) => {
    // console.log('user id', userId, 'items', itemsObject);
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
        cart = new Cart({ user: userId, items: [] });
    }
    // console.log('cart', cart);
    console.log('itemsobjce', itemsObject)
    // Access the items array within the itemsObject
    const items = itemsObject.items;
    // console.log('items before loop:', items);

    if (Array.isArray(items) && items.length > 0) {
        for (let item of items) {
            // console.log('reached1');
            const { product, quantity } = item;
            try {
                const productDetails = await Product.findById(product);
                // console.log('productDetails', productDetails);
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
                console.error('Error fetching product details:', error);
            }
        }
    } else {
        console.log('items is not an array or is empty');
    }

    await cart.save();
    return cart;
};







module.exports = { addToCart };
