var express = require('express');
var router = express.Router();
var dbmanager = require('../helpers/dbmanager');
var auth = require('../helpers/auth');
var requestValidator = require('../helpers/requestValidator');
var errors = require('../helpers/errors');

// Private API

router.use(auth.checkToken);

router.post('/', function(req, res, next) {
  var requiredFields = ['projectId', 'text', 'attachments'];
  try {
    requestValidator.checkParams(requiredFields, req);
  } catch (paramsError) {
    next(paramsError);
    return;
  }

  var projectId = req.body.projectId;
  var text = req.body.text;
  var attachments = req.body.attachments;
  
  dbmanager.addPost(projectId, text, attachments, function(err) {
    if (err) {
      next(err);
    } else {
      res.sendStatus(200);
    }
  })
});

router.get('/', function(req, res) {
  var projectId = req.query.projectId;
  var skip = req.query.skip || 0;
  var limit = req.query.limit || 20;

  if (!projectId) {
    next(errors.fieldNotFound('project id', 500));
    return;
  }

  dbmanager.getPosts(projectId, skip, limit, function(err, posts) {
    if (err) {
      next(err);
    } else {
      res.send(posts);
    }
  });
});

// Export

module.exports = router;