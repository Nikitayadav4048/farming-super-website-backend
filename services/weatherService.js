const axios = require('axios');

class WeatherService {
  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY || 'demo_key';
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  async getCurrentWeather(lat, lon) {
    // Mock data for testing (replace with real API when key is valid)
    if (this.apiKey === 'demo_key') {
      return {
        temperature: 28.5,
        humidity: 62,
        pressure: 1013,
        windSpeed: 12.3,
        windDirection: 180,
        description: 'clear sky',
        icon: '01d',
        visibility: 10000,
        uvIndex: 6,
        location: 'Delhi',
        timestamp: new Date()
      };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: { lat, lon, appid: this.apiKey, units: 'metric' }
      });
      const data = response.data;
      return {
        temperature: data.main.temp,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: data.wind?.speed || 0,
        windDirection: data.wind?.deg || 0,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        visibility: data.visibility || 0,
        uvIndex: data.uvi || 0,
        location: data.name,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Weather API Error:', error.response?.data || error.message);
      throw new Error(`Weather API failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getWeatherForecast(lat, lon) {
    // Mock data for testing
    if (this.apiKey === 'demo_key') {
      const forecast = [];
      for (let i = 0; i < 7; i++) {
        forecast.push({
          date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
          temperature: {
            min: 22 + Math.random() * 5,
            max: 32 + Math.random() * 8,
            current: 27 + Math.random() * 6
          },
          humidity: 55 + Math.random() * 25,
          windSpeed: 8 + Math.random() * 10,
          description: ['clear sky', 'few clouds', 'light rain'][i % 3],
          icon: '01d',
          precipitation: i % 3 === 2 ? Math.random() * 3 : 0
        });
      }
      return forecast;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: { lat, lon, appid: this.apiKey, units: 'metric' }
      });
      const forecast = response.data.list.slice(0, 7).map(item => ({
        date: new Date(item.dt * 1000),
        temperature: {
          min: item.main.temp_min,
          max: item.main.temp_max,
          current: item.main.temp
        },
        humidity: item.main.humidity,
        windSpeed: item.wind.speed,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        precipitation: item.rain ? item.rain['3h'] || 0 : 0
      }));
      return forecast;
    } catch (error) {
      throw new Error('Failed to fetch weather forecast');
    }
  }

  checkWeatherAlerts(weatherData, alerts) {
    const triggeredAlerts = [];

    alerts.forEach(alert => {
      let shouldTrigger = false;

      switch (alert.alertType) {
        case 'storm':
          shouldTrigger = weatherData.windSpeed > 15 || weatherData.description.includes('storm');
          break;
        case 'drought':
          shouldTrigger = weatherData.humidity < 30;
          break;
        case 'flood':
          shouldTrigger = weatherData.description.includes('rain') && weatherData.humidity > 90;
          break;
        case 'frost':
          shouldTrigger = weatherData.temperature < 2;
          break;
        case 'heatwave':
          shouldTrigger = weatherData.temperature > (alert.threshold || 35);
          break;
      }

      if (shouldTrigger) {
        triggeredAlerts.push({
          type: alert.alertType,
          message: this.getAlertMessage(alert.alertType, weatherData),
          severity: this.getAlertSeverity(alert.alertType, weatherData)
        });
      }
    });

    return triggeredAlerts;
  }

  getAlertMessage(type, weather) {
    const messages = {
      storm: `Storm warning! Wind speed: ${weather.windSpeed} m/s. Secure equipment and postpone outdoor activities.`,
      drought: `Low humidity alert: ${weather.humidity}%. Consider irrigation planning.`,
      flood: `Heavy rain expected. Check drainage systems and protect crops.`,
      frost: `Frost warning! Temperature: ${weather.temperature}°C. Protect sensitive plants.`,
      heatwave: `High temperature alert: ${weather.temperature}°C. Ensure adequate irrigation.`
    };
    return messages[type];
  }

  getAlertSeverity(type, weather) {
    if (type === 'storm' && weather.windSpeed > 25) return 'high';
    if (type === 'frost' && weather.temperature < 0) return 'high';
    if (type === 'heatwave' && weather.temperature > 40) return 'high';
    return 'medium';
  }

  getFarmingRecommendations(weatherData, forecast) {
    const recommendations = [];

    if (weatherData.temperature < 5) {
      recommendations.push('Protect crops from frost damage');
    }
    if (weatherData.windSpeed > 10) {
      recommendations.push('Avoid spraying pesticides due to high winds');
    }
    if (weatherData.humidity > 80) {
      recommendations.push('Monitor for fungal diseases');
    }

    const rainDays = forecast.filter(day => day.precipitation > 0).length;
    if (rainDays >= 3) {
      recommendations.push('Plan indoor activities for the next few days');
    }

    const hotDays = forecast.filter(day => day.temperature.max > 30).length;
    if (hotDays >= 2) {
      recommendations.push('Increase irrigation frequency');
    }

    return recommendations;
  }
}

module.exports = WeatherService;