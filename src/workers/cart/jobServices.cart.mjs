import { Cart } from '../../cart/cartModels.mjs';

export const getCart = (userId, session) => {
  return Cart.findOne({ userId }).session(session);
};

export const addNewCart = (userId, session, product) => {
  const newCart = new Cart({ userId });
  product.quantity = 1;
  newCart.items.push(product);
  newCart.updatedAt = new Date();
  return newCart.save({ session });
};

export const updateCart = (cart, session, product) => {
  const item = cart.items.find(
    item => item._id.toString() === product._id.toString(),
  );
  if (item) {
    item.quantity += 1;
  } else {
    product.quantity = 1;
    cart.items.push(product);
  }
  cart.updatedAt = new Date();
  return cart.save({ session });
};

export const removeItem = (cart, session, product) => {
  const index = cart.items.findIndex(
    item => item._id.toString() === product._id.toString(),
  );
  if (index !== -1) {
    cart.items.splice(index, 1);
  }
  cart.updatedAt = new Date();
  return cart.save({ session });
};

export const decreaseItem = (cart, session, product) => {
  const index = cart.items.findIndex(
    item => item._id.toString() === product._id.toString(),
  );
  if (index !== -1) {
    cart.items[index].quantity -= 1;
    if (cart.items[index].quantity === 0) {
      cart.items.splice(index, 1);
    }
  }
  cart.updatedAt = new Date();
  return cart.save({ session });
};
