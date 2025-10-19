const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  farmer_id: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['veggies', 'fruits', 'flowers', 'others']
  },
  items: [{
    product_name: {
      type: String,
      required: true
    },
    quantity_kg: {
      type: Number,
      required: true
    },
    price_per_kg: {
      type: Number,
      required: true
    }
  }],
  images: [{
    type: String
  }],
  location: {
    type: String,
    required: true
  },
  remarks: String,
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Stock', stockSchema);