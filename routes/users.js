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

router.post('/login', (req, res, next) => {
  if (requestValidator.checkParams(['email', 'password'], req, next)) { return }

  const email = req.body.email;
  const rawPassword = req.body.password;

  function getUserCallback(err, user) {
    if (err) {
      next(err);
    } else if (user) {
      if (hash.checkPassword(user.password, rawPassword)) {
        user.password = undefined;
        res.send(user);
      } else {
        next(errors.authWrongPassword());
      }
    } else {
      next(errors.authEmailNotRegistered());
    }
  };

  dbmanager.getUser({ email }, getUserCallback, '+password +token');
});

router.post('/signUp', (req, res, next) => {
  if (requestValidator.checkParams(['email', 'password'], req, next)) { return }

  const email = req.body.email;
  const rawPassword = req.body.password;

  function addUserCallback(err, user) {
    if (err) {
      next(err);
    } else {
      user.password = undefined;
      res.send(user);
    }
  };

  dbmanager.addUser({
    email,
    password: hash.hashPassword(rawPassword),
    token: jwt.sign(email, config.jwtSecret)
  }, addUserCallback);
});

// todo: add password recovery
router.post('/recoverPassword', (req, res, next) => {
  next(errors.error(501));
});

// Private API

router.use(auth.checkToken);

router.post('/manager', (req, res, next) => {
  if (requestValidator.checkParams(['email'], req, next)) { return }

  const managerEmail = req.body.email;
  const userId = req.get('x-access-user-id');

  function getManagerCallback(owner, manager) {
    owner.managers.push(manager);
    owner.save((err, newOwner) => {
      if (err) {
        next(err);
      } else {
        res.send(manager);
        // TODO: notify manager about being added
      }
    });
  };

  function getOwnerCallback(owner) {
    dbmanager.getUser({ email: managerEmail }, (err, user) => {
      if (err) {
        next(err);
      } else if (user) {
        getManagerCallback(owner, user);
      } else {
        dbmanager.addManager(managerEmail, (err, manager) => {
          if (err) {
            next(err);
          } else {
            getManagerCallback(owner, manager);
          }
        })
      }
    });
  };

  dbmanager.getUserById(userId, (err, user) => {
    if (err) {
      next(err);
    } else if (user) {
      getOwnerCallback(user);
    }
  });
});

router.get('/manager', (req, res, next) => {
  const userId = req.get('x-access-user-id');

  dbmanager.getUserById(userId, (err, user) => {
    if (err) {
      next(err);
    } else if (user) {
      res.send(user.managers);
    }
  }, 'managers', null, 'managers');
});

router.delete('/manager', (req, res, next) => {
  if (requestValidator.checkParams(['managerId'], req, next)) { return }

  const managerId = req.body.managerId;
  const userId = req.get('x-access-user-id');

  dbmanager.getUserById(userId, (err, user) => {
    if (err) {
      next(err);
    } else if (user) {
      const index = user.managers.indexOf(managerId);
      if (index > -1) { 
        user.managers.splice(index, 1);
        user.save((err, newUser) => {
          if (err) {
            next(err);
          } else {
            res.send(newUser);
          }
        })
      } else {
        next(errors.error(500, 'No manager found'));
      }
    }
  }, 'managers', null);
});

// Export

module.exports = router;