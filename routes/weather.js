const express = require('express');
const WeatherService = require('../services/weatherService');
const { WeatherAlert } = require('../models/Weather');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const weatherService = new WeatherService();

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET || 'farming-secret-key', async (err, decoded) => {
    if (err) return res.sendStatus(403);
    try {
      req.user = await User.findById(decoded.id);
      if (!req.user) return res.sendStatus(403);
      next();
    } catch (error) {
      return res.sendStatus(403);
    }
  });
};

// Test endpoint without auth
router.get('/test', async (req, res) => {
  try {
    const weather = await weatherService.getCurrentWeather(28.6139, 77.2090);
    res.json({ weather });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current weather
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const weather = await weatherService.getCurrentWeather(lat, lon);
    const alerts = await WeatherAlert.find({ userId: req.user._id, isActive: true });
    const triggeredAlerts = weatherService.checkWeatherAlerts(weather, alerts);

    res.json({
      weather,
      alerts: triggeredAlerts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get 7-day forecast
router.get('/forecast', authenticateToken, async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const forecast = await weatherService.getWeatherForecast(lat, lon);
    const current = await weatherService.getCurrentWeather(lat, lon);
    const recommendations = weatherService.getFarmingRecommendations(current, forecast);

    res.json({
      forecast,
      recommendations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create weather alert
router.post('/alerts', authenticateToken, async (req, res) => {
  try {
    const { alertType, location, threshold } = req.body;
    
    const alert = new WeatherAlert({
      userId: req.user._id,
      alertType,
      location,
      threshold
    });

    await alert.save();
    res.json({ message: 'Alert created successfully', alert });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user alerts
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const alerts = await WeatherAlert.find({ userId: req.user._id });
    res.json({ alerts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete alert
router.delete('/alerts/:id', authenticateToken, async (req, res) => {
  try {
    await WeatherAlert.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;