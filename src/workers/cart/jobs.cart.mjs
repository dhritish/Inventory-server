import mongoose from 'mongoose';
import * as cartJobServices from './jobServices.cart.mjs';

export async function addToCart(data) {
  const { product, userId } = data;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const cart = await cartJobServices.getCart(userId, session);
      if (!cart) {
        await cartJobServices.addNewCart(userId, session, product);
      } else {
        await cartJobServices.updateCart(cart, session, product);
      }
    });
  } catch (error) {
    throw new Error(error);
  } finally {
    await session.endSession();
  }
}

export async function removeFromCart(data) {
  const { product, userId } = data;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const cart = await cartJobServices.getCart(userId, session);
      if (cart) {
        await cartJobServices.removeItem(cart, session, product);
      }
    });
  } catch (error) {
    throw new Error(error);
  } finally {
    await session.endSession();
  }
}

export async function decreaseFromCart(data) {
  const { product, userId } = data;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const cart = await cartJobServices.getCart(userId, session);
      if (cart) {
        await cartJobServices.decreaseItem(cart, session, product);
      }
    });
  } catch (error) {
    throw new Error(error);
  } finally {
    await session.endSession();
  }
}
