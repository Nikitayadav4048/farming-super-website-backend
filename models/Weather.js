const mongoose = require('mongoose');

const weatherAlertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  alertType: { type: String, enum: ['storm', 'drought', 'flood', 'frost', 'heatwave'], required: true },
  location: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  threshold: { type: Number }, // Temperature, rainfall, etc.
  createdAt: { type: Date, default: Date.now }
});

const WeatherAlert = mongoose.model('WeatherAlert', weatherAlertSchema);

module.exports = { WeatherAlert };