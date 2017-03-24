/** Dependencies */
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config({
  path: path.join(__dirname, '/.env'),
});
const config = require('./config');
const reporter = require('./helpers/reporter');
const errors = require('./helpers/errors');

/** Change default promises to bluebird */
global.Promise = require('bluebird');
/** Turn on cancellation for promises in bluebird */
Promise.config({ cancellation: true });

/** Create app */
const app = express();

/** Setup mongoose and load all models */
mongoose.connect(config.database);
mongoose.Promise = global.Promise;
fs.readdirSync(path.join(__dirname, '/models')).forEach((filename) => {
  require(path.join(__dirname, '/models/', filename));
});

/** Getting auth after loading mongoose because it depends on user model */
const auth = require('./helpers/auth');

/** Require routes */
const users = require('./routes/users');
const projects = require('./routes/projects');
const posts = require('./routes/posts');
const publicRoute = require('./routes/public');
const main = require('./routes/main');
const payments = require('./routes/payments');
const test = require('./routes/test');

/** View engine setup */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
/** Setup favicon */
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
/** Setup logger */
app.use(logger('common', {
  stream: fs.createWriteStream('./access.log', { flags: 'a' }),
}));
app.use(logger('dev'));
/** Setup body parser */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
/** Setup cookie parser */
app.use(cookieParser());
/** Expose public folder */
app.use(express.static(path.join(__dirname, 'public')));
/** Support cors */
/** TODO: need to support only approved cors */
app.use(cors());

/** Redirect public routes */
app.use('/public/', publicRoute);
app.use('/', main);
app.use('/test/', test);

/** Check api token */
app.use(auth.checkApiKey);

/** Redirect routes */
app.use('/users/', users);
app.use('/projects', projects);
app.use('/posts/', posts);
app.use('/payments/', payments);

/** Catch 404 and forward to error handler */
app.use((req, res, next) => {
  const err = new Error();
  err.status = 404;
  err.message = 'Not found';
  err.type = 'NOT_FOUND_ERROR';
  next(err);
});

/** Error handler */
app.use((err, req, res, next) => {
  err = errors.standardize(err);
  reporter.reportError(err, req);
  res.status(err.status || 500);
  res.send(err);
});

/** Exports */
module.exports = app;
