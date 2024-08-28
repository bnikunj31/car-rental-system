// config/nexmo.js
const { Vonage } = require('@vonage/server-sdk');

const vonage = new Vonage({
  apiKey: 'YOUR_API_KEY',
  apiSecret: 'YOUR_API_SECRET'
});

module.exports = vonage;
