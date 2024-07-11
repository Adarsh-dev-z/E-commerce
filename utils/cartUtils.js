const Cart = require('../models/cart');
const Product = require('../models/product');

const addToCart = async (userId, items) => {
  console.log('user id',userId,'items',items);
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = new Cart({ user: userId, items: [] });
  }
  console.log(cart, items);

  for (let item of items) {
    const { productId, quantity } = item;
    const product = await Product.findById(productId);

    if (product) {
      const itemIndex = cart.items.findIndex(cartItem => cartItem.product.toString() === productId);
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
        cart.items[itemIndex].totalPrice = product.price * cart.items[itemIndex].quantity;
      } else {
        cart.items.push({
          product: productId,
          quantity: quantity,
          price: product.price,
          totalPrice: product.price * quantity
        });
      }
    }
  }

  await cart.save();
  return cart;
};

module.exports = { addToCart };
