![Controlio](/designs/github_header.png?raw=true)
# Controlio server
Controlio is an extremely simple status report system. It's like twitter but intended for your subcontractors. This is a pretty old project, not supported or live anymore but has been published publically as a tribute to the legacy left after Controlio ahs been created. Enjoy!
## List of repositories
* [Server](https://github.com/backmeupplz/controlio-server) — backend code for Controlio
* [Landing](https://github.com/backmeupplz/controlio-landing) — landing front page of the former controlio.co website
* [Web client](https://github.com/backmeupplz/controlio-web) — frontend of the web app connected to this server
* [iOS client](https://github.com/backmeupplz/controlio-ios) — iOS client app connected to this server 
* [Android client](https://github.com/adonixis/controlio-android/) — Android client connected to this server
* [API documentaion](API.md) — documentation for this API


## Installation and local launch

1. Create the .env file in the root directory of the project
2. Run `npm i`
3. Launch local MongoDB instance
4. Run `npm start`

P.S., installation instructions might be ridiculously outdated. Sorry.

# Environment variables

* `API_KEY` — any string, you will sign all the requests with it
* `JWT_SECRET` — any string, server will use it to salt users' JWT
* `MONGO_URL` — address of the mongo db you're using
* `SENDGRID_API_KEY` — api key for Sendgrid used to send emails
* `TOKEN_SALT` — any string, server will use id to salt random tokens we need for magic links and reset password 
* `STRIPE_API_KEY` — api key for Stripe
* `(Optional) TELEGRAM_KEY` — Telegram bot token to send logs
* `(Optional) TELEGRAM_ID` — id of the telegram chat where to send logs
* `(Optional) SERVER_URL` — base url of your server (used in emails); defaults to `https://api.controlio.co`

## License
MIT — use for any purpose. Would be great if you could leave a note about the original developers. Thanks!
