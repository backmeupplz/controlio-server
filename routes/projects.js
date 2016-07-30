const express = require('express');
const router = express.Router();
const dbmanager = require('../helpers/dbmanager');
const auth = require('../helpers/auth');
const requestValidator = require('../helpers/requestValidator');

// Private API

router.use(auth.checkToken);

router.post('/', (req, res, next) => {
  if (requestValidator.checkParams(['title', 'image', 'status', 'description', 'manager', 'clients'], req, next)) { return }
  
  dbmanager.addProject(req, (err, project) => {
    if (err) {
      next(err);
    } else {
      res.sendStatus(200);
    }
  });
});

router.get('/', (req, res, next) => {
  const userId = req.get('x-access-user-id');
  const skip = parseInt(req.query.skip) || 0;
  const limit = parseInt(req.query.limit) || 20;
  dbmanager.getProjects(userId, skip, limit, (err, projects) => {
    if (err) {
      next(err);
    } else {
      res.send(projects);
    }
  });
});

// Export

module.exports = router;