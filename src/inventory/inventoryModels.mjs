import mongoose from 'mongoose';

const itemsWithExpire = new mongoose.Schema({
  barcode: {
    type: mongoose.Schema.Types.String,
    default: null,
  },
  name: {
    type: mongoose.Schema.Types.String,
    required: true,
  },
  price: {
    type: mongoose.Schema.Types.Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: mongoose.Schema.Types.Number,
    required: true,
    min: 0,
  },
  expire: {
    type: mongoose.Schema.Types.Date,
    default: null,
  },
  category: {
    type: mongoose.Schema.Types.String,
    required: true,
  },
  embedding: {
    type: [Number],
    default: null,
  },
});
itemsWithExpire.index({ name: 1, price: 1, expire: 1 });
itemsWithExpire.index({ barcode: 1, expire: 1 });

const totalOfItems = new mongoose.Schema({
  barcode: {
    type: mongoose.Schema.Types.String,
    default: null,
  },
  name: {
    type: mongoose.Schema.Types.String,
    required: true,
  },
  price: {
    type: mongoose.Schema.Types.Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: mongoose.Schema.Types.Number,
    required: true,
    min: 0,
  },
  category: {
    type: mongoose.Schema.Types.String,
    required: true,
  },
  embedding: {
    type: [Number],
    default: null,
  },
});
totalOfItems.index({ name: 1, price: 1 });
totalOfItems.index({ barcode: 1 });

export const ItemsWithExpire = mongoose.model(
  'ItemsWithExpire',
  itemsWithExpire,
);
export const TotalOfItems = mongoose.model('TotalOfItems', totalOfItems);
