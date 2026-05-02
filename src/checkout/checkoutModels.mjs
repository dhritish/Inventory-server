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
  packed: {
    type: Boolean,
    default: false,
  },
  delivered: {
    type: Boolean,
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
  location: {
    type: [Number, Number],
    required: true,
  },
});

export const Order = mongoose.model('Order', order);
export const IndividualItemTransactions = mongoose.model(
  'IndividualItemTransactions',
  individualItemTransactions,
);
