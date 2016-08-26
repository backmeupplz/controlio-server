const express = require('express');
const router = express.Router();
const dbmanager = require('../helpers/dbmanager');
const hash = require('../helpers/hash');
const jwt = require('jsonwebtoken');
const config = require('../config');
const errors = require('../helpers/errors');
const auth = require('../helpers/auth');
const requestValidator = require('../helpers/requestValidator');

// Public API

router.post('/login', requestValidator.check(['email', 'password']), (req, res, next) => {
  const email = req.body.email;
  const rawPassword = req.body.password;

  dbmanager.getUser({ email }, '+password +token')
    .then(user => {
      if (user) {
        if (hash.checkPassword(user.password, rawPassword)) {
          user.password = undefined;
          res.send(user);
        } else {
          next(errors.authWrongPassword());
        }
      } else {
        next(errors.authEmailNotRegistered());
      }
    })
    .catch(err => {
      next(err);
    });
});

router.post('/signUp', requestValidator.check(['email', 'password']), (req, res, next) => {
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
    .catch(err => {
      next(err);
    });
});

// todo: add password recovery
router.post('/recoverPassword', (req, res, next) => {
  next(errors.error(501));
});

// Private API

router.use(auth.checkToken);

router.post('/manager', requestValidator.check(['email']), (req, res, next) => {
  const managerEmail = req.body.email;
  const userId = req.get('x-access-user-id');

  dbmanager.getUserById(userId)
    .then(owner => {
      dbmanager.getUser({ email: managerEmail })
        .then(manager => {
          if (manager) {
            owner.managers.push(manager);
            owner.save()
              .then(owner => {
                res.send(manager);
                // TODO: notify manager about being added
              });
          } else {
            dbmanager.addManager(managerEmail)
              .then(manager => {
                  owner.save()
                    .then(owner => {
                      res.send(manager);
                      // TODO: notify manager about being added
                    });
              })
          }
        })
    })
    .catch(err => {
      next(err);
    });
});

router.get('/managers', (req, res, next) => {
  const userId = req.get('x-access-user-id');

  dbmanager.getUserById(userId, 'managers', null, 'managers')
    .then(user => {
      res.send(user.managers);
    })
    .catch(err => {
      next(err);
    });
});

router.delete('/manager', requestValidator.check(['managerId']), (req, res, next) => {
  if (requestValidator.checkParams(['managerId'], req, next)) { return }

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
    .catch(err => {
      next(err);
    });
});

// Export

module.exports = router;