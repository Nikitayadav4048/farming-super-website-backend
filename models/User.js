const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true
  },
  phone: {
    type: String,
    unique: true,
    sparse: true
  },
  password: {
    type: String
  },
  role: {
    type: String,
    enum: ['farmer', 'pilot', 'retail', 'admin'],
    default: 'farmer'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profilePicture: {
    type: String
  },
  isGoogleAuth: {
    type: Boolean,
    default: false
  },
  isFacebookAuth: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.generateToken = function() {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    process.env.JWT_SECRET || 'farming-secret-key',
    { expiresIn: '7d' }
  );
};

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateResetToken = function() {
  const resetToken = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit number
  this.resetPasswordToken = resetToken;
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);


