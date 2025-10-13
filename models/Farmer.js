const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
  // Personal Details
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    length: 10,
    unique: true
  },
  village: {
    type: String,
    required: true,
    trim: true
  },
  block: {
    type: String,
    required: true,
    trim: true
  },
  district: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  pin: {
    type: String,
    required: true,
    length: 6
  },
  category: {
    type: String,
    required: true,
    enum: ['SC', 'ST', 'OBC', 'General']
  },
  farmArea: {
    type: Number,
    required: true,
    min: 0
  },
  primaryCrops: {
    type: String,
    required: true,
    trim: true
  },

  // KYC Details
  aadharNumber: {
    type: String,
    required: true,
    length: 12,
    unique: true
  },
  aadharFront: {
    type: String,
    required: true
  },
  aadharBack: {
    type: String,
    required: true
  },
  selfie: {
    type: String,
    required: true
  },
  panNumber: {
    type: String,
    required: false,
    trim: true
  },

  // Bank Details
  accountHolder: {
    type: String,
    required: true,
    trim: true
  },
  bankName: {
    type: String,
    required: true,
    trim: true
  },
  branch: {
    type: String,
    required: true,
    trim: true
  },
  accountNumber: {
    type: String,
    required: true,
    trim: true
  },
  ifsc: {
    type: String,
    required: true,
    trim: true
  },
  cheque: {
    type: String,
    required: true
  },
  upi: {
    type: String,
    required: false,
    trim: true
  },

  // GPS & Farm Location
  farmLocation: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  farmPhoto: {
    type: String,
    required: false
  },

  // System Fields (Auto Generated)
  farmerId: {
    type: String,
    unique: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  verifiedBy: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Verified'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

// Generate unique farmer ID before saving
farmerSchema.pre('save', async function(next) {
  if (!this.farmerId) {
    const count = await mongoose.model('Farmer').countDocuments();
    this.farmerId = `FRM${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Farmer', farmerSchema);