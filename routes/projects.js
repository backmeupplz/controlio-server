var express = require('express');
var router = express.Router();
var dbmanager = require('../helpers/dbmanager');
var auth = require('../helpers/auth');
var errors = require('../helpers/errors');
var requestValidator = require('../helpers/requestValidator');

// Private API

router.use(auth.checkToken);

router.post('/', function(req, res, next) {
  var requiredFields = ['title', 'image', 'status', 'description', 'manager', 'clients'];
  try {
    requestValidator.checkParams(requiredFields, req);
  } catch (paramsError) {
    next(paramsError);
    return;
  }
  
  dbmanager.addProject(req, function(err) {
    if (err) {
      next(err);
    } else {
      res.sendStatus(200);
    }
  });
});

// todo: refactor
router.get('/', function(req, res, next) {
  var userId = req.get('x-access-user-id');
  var skip = parseInt(req.query.skip) || 0;
  var limit = parseInt(req.query.limit) || 20;
  dbmanager.getProjects(userId, skip, limit, function(err, projects) {
    if (err) {
      next(err);
    } else {
      res.send(projects);
    }
  });
});

// Export

module.exports = router;