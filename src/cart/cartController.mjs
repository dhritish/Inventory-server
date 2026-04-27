import z from 'zod';
import * as cartServices from './cartServices.mjs';

const cartSchema = z.object({
  _id: z.string().min(1),
});

export const addToCart = async (request, response) => {
  const { body, user } = request;
  const result = cartSchema.safeParse(body);
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }
  const product = result.data;
  await cartServices.addToCart(product, user);
  return response.status(200).json({ success: true });
};

export const removeFromCart = async (request, response) => {
  const { body, user } = request;
  const result = cartSchema.safeParse(body);
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }
  const product = result.data;
  await cartServices.removeFromCart(product, user);
  return response.status(200).json({ success: true });
};

export const decreaseFromCart = async (request, response) => {
  const { body, user } = request;
  const result = cartSchema.safeParse(body);
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }
  const product = result.data;
  await cartServices.decreseFromCart(product, user);
  return response.status(200).json({ success: true });
};

export const getCart = async (request, response) => {
  const { user } = request;
  const cart = await cartServices.getCart(user);
  return response.status(200).json({ success: true, cart });
};
