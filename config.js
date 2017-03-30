module.exports = {
  apiKey: process.env.API_KEY,
  jwtSecret: process.env.JWT_SECRET,
  database: process.env.MONGO_URL,
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  randomTokenSalt: process.env.TOKEN_SALT,
  stripeApiKey: process.env.STRIPE_API_KEY,
  telegramKey: process.env.TELEGRAM_KEY,
  telegramLogsId: process.env.TELEGRAM_ID,
  url: process.env.SERVER_URL || 'https://api.controlio.co',
  port: process.env.PORT || 8443,
};
