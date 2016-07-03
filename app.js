var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var fs = require('fs');
var config = require('./config');
var errors = require('./helpers/errors');
var app = express();

// setup mongoose and load all models
mongoose.connect(config.database);
fs.readdirSync(path.join(__dirname, '/models')).forEach(function(filename) {
  if (~filename.indexOf('.js')) {
    require(path.join(__dirname, '/models/', filename))
  }
});

var auth = require('./helpers/auth');

// require routes
var users = require('./routes/users');
var projects = require('./routes/projects');
var posts = require('./routes/posts');
var base = require('./routes/base');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('common', {
  stream: fs.createWriteStream('./access.log', {flags: 'a'})
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
app.use('/', base);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(errors.notFound());
});

// error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send(err);
});

console.log('Server is up and running!');

module.exports = app;
