# Node.js backend for Controlio #

* `https://api.controlio.co` — production instance
* `http://api.controlio.co:3001` — test instance
* [API documentaion](API.md)

### How do I get set up? ###

Create a .env file in the root directory of Controlio.

Add these environment variables:

* `API_KEY` — any string, you will sign all the requests with it
* `JWT_SECRET` — any string, server will use it to salt users' JWT
* `MONGO_URL` — address of the mongo db you're using
* `SENDGRID_API_KEY` — api key for Sendgrid used to send emails, you can use our test one: `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`
* `TOKEN_SALT` — any string, server will use id to salt random tokens we need for magic links and reset password 
* `STRIPE_API_KEY` — api key for Stripe, you can use our test one: `sk_test_YHIgl0QMnM5p0XI6YEPFdhmd`
* `(Optional) TELEGRAM_KEY` — Telegram bot token to send logs
* `(Optional) TELEGRAM_ID` — id of the telegram chat where to send logs
* `(Optional) SERVER_URL` — base url of your server (used in emails). Defaults to `https://api.controlio.co`

Make sure you don't have conflicts with the environment variables from the ~/.bash_profile or other similar places in the system.
