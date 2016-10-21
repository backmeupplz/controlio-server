module.exports = {
  apiKey: process.env.API_KEY,
  jwtSecret: process.env.JWT_SECRET,
  database: process.env.MONGO_URL,
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  randomTokenSalt: process.env.TOKEN_SALT,
  stripeApiKey: process.env.STRIPE_API_KEY,
};
