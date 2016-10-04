const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const fs = require('fs');
const config = require('./config');
const errors = require('./helpers/errors');

const app = express();

// setup mongoose and load all models
mongoose.connect(config.database);
mongoose.Promise = global.Promise;
fs.readdirSync(path.join(__dirname, '/models')).forEach((filename) => {
  require(path.join(__dirname, '/models/', filename)); // eslint-disable-line global-require
});

global.pushNotifications = require('./helpers/pushNotifications');
const auth = require('./helpers/auth');

// require routes
const users = require('./routes/users');
const projects = require('./routes/projects');
const posts = require('./routes/posts');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('common', {
  stream: fs.createWriteStream('./access.log', { flags: 'a' }),
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// check api token
app.use(auth.checkApiKey);

// redirect routes
app.use('/users/', users);
app.use('/projects', projects);
app.use('/posts/', posts);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(errors.notFound());
});

// error handler
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  res.status(err.status || 500);
  res.send(err);
});

console.log('Server is up and running!'); // eslint-disable-line no-console
module.exports = app;
