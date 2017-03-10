# Controlio backend #

Node.js backend for controlio.co.

* `https://api.controlio.co` — production instance
* `https://test.controlio.co` — staging instance

### How do I get set up? ###

Create a .env file in the root directory of Controlio.

Add these environment-specific variables:

`API_KEY=api key for the app`
`JWT_SECRET=secret used to generate JWT’s for users`
`MONGO_URL=address of your mongo db`
`SENDGRID_API_KEY=api key for sendgrid.com to send emails`
`TOKEN_SALT=salt to create user session tokens`
`STRIPE_API_KEY=stripe.com secret key`
`TELEGRAM_KEY=telegram bot token to send logs`
`TELEGRAM_ID=id of the telegram chat where to send logs`
