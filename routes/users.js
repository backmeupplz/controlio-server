const express = require('express');
const router = express.Router();
const dbmanager = require('../helpers/dbmanager');
const hash = require('../helpers/hash');
const jwt = require('jsonwebtoken');
const config = require('../config');
const errors = require('../helpers/errors');
const auth = require('../helpers/auth');
const validate = require('express-validation');
const validation = require('../validation/users');

// Public API

router.post('/login', validate(validation.login), (req, res, next) => {
  const email = req.body.email;
  const rawPassword = req.body.password;
  dbmanager.getUser({ email }, '+password +token')
    .then(user => {
      if (!user) {
        return next(errors.authEmailNotRegistered());
      } else if (!hash.checkPassword(user.password, rawPassword)) {
        return next(errors.authWrongPassword());
      }
      user.password = undefined;
      res.send(user);
    })
    .catch(err => next(err));
});

router.post('/signUp', validate(validation.signup), (req, res, next) => {
  const email = req.body.email;
  const rawPassword = req.body.password;

  const user = {
    email,
    password: hash.hashPassword(rawPassword),
    token: jwt.sign(email, config.jwtSecret)
  };

  dbmanager.addUser(user)
    .then(user => {
      user.password = undefined;
      res.send(user);
    })
    .catch(err => next(err));
});

// todo: add password recovery
router.post('/recoverPassword', (req, res, next) => {
  next(errors.error(501));
});

// Private API

router.use(auth.checkToken);

router.post('/manager', validate(validation.addManager), (req, res, next) => {
  const managerEmail = req.body.email;
  const userId = req.get('x-access-user-id');

  Promise.all([
      function() {
        return dbmanager.getUserById(userId);
      },
      function() {
        return dbmanager.getUser({ email: managerEmail })
          .then(manager => {
            if (manager) {
              return manager;
            } else {
              return dbmanager.addManager(managerEmail)
                .then(manager => {
                    return manager;
                })
            }
          });
      }
  ])
    .spread((owner, manager) => {
      owner.managers.push(manager);
      return owner.save()
        .then(owner => {
          res.send(manager);
          // TODO: notify manager about being added
        });
    })
    .catch(err => next(err));
});

router.get('/managers', (req, res, next) => {
  const userId = req.get('x-access-user-id');

  dbmanager.getUserById(userId, 'managers', null, 'managers')
    .then(user => {
      res.send(user.managers);
    })
    .catch(err => next(err));
});

router.delete('/manager', validate(validation.deleteManager), (req, res, next) => {
  const managerId = req.body.managerId;
  const userId = req.get('x-access-user-id');

  dbmanager.getUserById(userId, 'managers', null)
    .then(user => {
      const index = user.managers.indexOf(managerId);
      if (index > -1) { 
        user.managers.splice(index, 1);
        user.save()
          .then(user => {
            res.send(user);
          });
      } else {
        next(errors.error(500, 'No manager found'));
      }
    })
    .catch(err => next(err));
});

// Export

module.exports = router;