// dependencies
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const config = require('./config');
const botReporter = require('./helpers/botReporter');
// change default promises to bluebird
global.Promise = require('bluebird');
// turn on cancellation for promises in bluebird
Promise.config({ cancellation: true });

// create app
const app = express();

// setup mongoose and load all models
mongoose.connect(config.database);
mongoose.Promise = global.Promise;
fs.readdirSync(path.join(__dirname, '/models')).forEach((filename) => {
  require(path.join(__dirname, '/models/', filename)); // eslint-disable-line global-require
});

// getting auth after loading mongoose because it depends on user model
const auth = require('./helpers/auth');

// require routes
const users = require('./routes/users');
const projects = require('./routes/projects');
const posts = require('./routes/posts');
const publicRoute = require('./routes/public');
const main = require('./routes/main');
const payments = require('./routes/payments');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
// setup favicon
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// setup logger
app.use(logger('common', {
  stream: fs.createWriteStream('./access.log', { flags: 'a' }),
}));
app.use(logger('dev'));
// setup body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// setup cookie parser
app.use(cookieParser());
// expose public folder
app.use(express.static(path.join(__dirname, 'public')));
// support cors
app.use(cors());

// redirect public routes
app.use('/public/', publicRoute);
app.use('/', main);

// check api token
app.use(auth.checkApiKey);

// redirect routes
app.use('/users/', users);
app.use('/projects', projects);
app.use('/posts/', posts);
app.use('/payments/', payments);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error();
  err.status = 404;
  err.message = 'Not found';
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  botReporter.reportError(err, req);
  res.status(err.status || 500);
  res.send(err);
});

// exports
module.exports = app;
