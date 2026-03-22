import mongoose from 'mongoose';

const transactions = new mongoose.Schema({
  date: {
    type: mongoose.Schema.Types.Date,
    required: true,
    index: true,
  },
  total: {
    type: mongoose.Schema.Types.Number,
    required: true,
  },
});

const monthlySales = new mongoose.Schema({
  month: {
    type: mongoose.Schema.Types.Date,
    required: true,
    index: true,
  },
  total: {
    type: mongoose.Schema.Types.Number,
    require: true,
  },
});

const dailySales = new mongoose.Schema({
  date: {
    type: mongoose.Schema.Types.Date,
    required: true,
    index: true,
  },
  total: {
    type: mongoose.Schema.Types.Number,
    required: true,
  },
});

const categories = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.String,
    required: true,
    unique: true,
  },
});

const categoryWiseMonthlySales = new mongoose.Schema({
  month: {
    type: mongoose.Schema.Types.Date,
    required: true,
  },
  total: {
    type: mongoose.Schema.Types.Number,
    require: true,
  },
  category: {
    type: mongoose.Schema.Types.String,
    required: true,
  },
});
categoryWiseMonthlySales.index({ category: 1, month: 1 });

const categoryWiseDailySales = new mongoose.Schema({
  date: {
    type: mongoose.Schema.Types.Date,
    required: true,
  },
  total: {
    type: mongoose.Schema.Types.Number,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.String,
    required: true,
  },
});
categoryWiseDailySales.index({ category: 1, date: 1 });

const individualItemMonthlySales = new mongoose.Schema({
  name: {
    type: mongoose.Schema.Types.String,
    required: true,
  },
  price: {
    type: mongoose.Schema.Types.Number,
    required: true,
  },
  month: {
    type: mongoose.Schema.Types.Date,
    required: true,
  },
  quantity: {
    type: mongoose.Schema.Types.Number,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.String,
    required: true,
    default: 'others',
  },
});
individualItemMonthlySales.index({ name: 1, price: 1, month: 1 });

export const Transactions = mongoose.model('Transactions', transactions);
export const MonthlySales = mongoose.model('MonthlySales', monthlySales);
export const DailySales = mongoose.model('DailySales', dailySales);
export const Categories = mongoose.model('Categories', categories);
export const CategoryWiseMonthlySales = mongoose.model(
  'CategoryWiseMonthlySales',
  categoryWiseMonthlySales,
);
export const CategoryWiseDailySales = mongoose.model(
  'CategoryWiseDailySales',
  categoryWiseDailySales,
);
export const IndividualItemMonthlySales = mongoose.model(
  'IndividualItemMonthlySales',
  individualItemMonthlySales,
);
