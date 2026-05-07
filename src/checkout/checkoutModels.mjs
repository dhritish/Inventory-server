import mongoose from 'mongoose';

const individualItemTransactions = new mongoose.Schema({
  name: {
    type: mongoose.Schema.Types.String,
    required: true,
  },
  price: {
    type: mongoose.Schema.Types.Number,
    required: true,
  },
  expire: {
    type: mongoose.Schema.Types.Date,
    default: null,
  },
  quantity: {
    type: mongoose.Schema.Types.Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  sold_date: {
    type: mongoose.Schema.Types.Date,
    required: true,
  },
  status: {
    type: mongoose.Schema.Types.String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending',
  },
  qr_id: {
    type: mongoose.Schema.Types.String,
    default: null,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});
individualItemTransactions.index({ status: 1, sold_date: 1 });

const order = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TotalOfItems',
        required: true,
      },
      name: {
        type: mongoose.Schema.Types.String,
        required: true,
      },
      price: {
        type: mongoose.Schema.Types.Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],
  total: {
    type: mongoose.Schema.Types.Number,
    required: true,
  },
  status: {
    type: mongoose.Schema.Types.String,
    enum: ['pending', 'packed', 'out for delivery', 'delivered', 'cancelled'],
    default: 'pending',
  },
  isDelivered: {
    type: mongoose.Schema.Types.Boolean,
    default: false,
  },
  payment: {
    type: mongoose.Schema.Types.String,
    enum: ['POD', 'pending', 'paid', 'failed', 'expired'],
    required: true,
  },
  orderId: {
    type: mongoose.Schema.Types.String,
    default: null,
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  location: {
    type: [Number, Number],
    required: true,
  },
  createdAt: {
    type: mongoose.Schema.Types.Date,
    default: Date.now,
  },
  modifiedAt: {
    type: mongoose.Schema.Types.Date,
    default: Date.now,
  },
});
order.index({ user: 1, isDelivered: 1 });
order.index({ status: 1, agentId: 1 });

export const Order = mongoose.model('Order', order);
export const IndividualItemTransactions = mongoose.model(
  'IndividualItemTransactions',
  individualItemTransactions,
);
