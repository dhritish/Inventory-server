import { create } from 'domain';
import mongoose from 'mongoose';

const deliveryRoutes = new mongoose.Schema({
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orders: [
    {
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
      },
      location: {
        type: [Number, Number],
        required: true,
      },
      payment: {
        type: mongoose.Schema.Types.String,
        enum: ['POD', 'pending', 'paid', 'failed', 'expired'],
        required: true,
      },
    },
  ],
  geometry: {
    type: mongoose.Schema.Types.String,
    default: null,
  },
  status: {
    type: mongoose.Schema.Types.String,
    enum: ['pending', 'on route', 'delivered'],
    default: 'pending',
  },
  totalPrice: {
    type: mongoose.Schema.Types.Number,
    required: true,
  },
  totalItems: {
    type: mongoose.Schema.Types.Number,
    required: true,
  },
  createdAt: {
    type: mongoose.Schema.Types.Date,
    default: Date.now,
  },
});
deliveryRoutes.index({ agentId: 1, status: 1 });

export const DeliveryRoutes = mongoose.model('DeliveryRoutes', deliveryRoutes);
