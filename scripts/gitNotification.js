const TelegramBot = require('node-telegram-bot-api');

const jarvis = new TelegramBot('237463370:AAGI_aywb5T-oCyFaRHsgae5XhuEwWd257o', { polling: false });

jarvis.sendMessage(-1001107091033, '✅ Controlio has been successfully deployed!');