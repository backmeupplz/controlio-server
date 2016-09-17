const dbmanager = require('../helpers/dbmanager');
const hash = require('../helpers/hash');
const jwt = require('jsonwebtoken');
const config = require('../config');
const errors = require('../helpers/errors');
const auth = require('../helpers/auth');
const validate = require('express-validation');
const validation = require('../validation/users');
const router = require('express').Router(); // eslint-disable-line new-cap

// Public API

router.post('/login', validate(validation.login), (req, res, next) => {
  const email = req.body.email;
  const rawPassword = req.body.password;
  dbmanager.getUser({ email }, '+password +token')
    .then((user) => {
      if (!user) {
        next(errors.authEmailNotRegistered());
      } else {
        hash.checkPassword(user.password, rawPassword)
          .then((result) => {
            if (!result) {
              next(errors.authWrongPassword());
            } else {
              const userWithoutPassword = user;
              userWithoutPassword.password = undefined;
              res.send(userWithoutPassword);
            }
          })
          .catch(err => next(err));
      }
    })
    .catch(err => next(err));
});

router.post('/signUp', validate(validation.signup), (req, res, next) => {
  const email = req.body.email;
  const rawPassword = req.body.password;

  hash.hashPassword(rawPassword)
    .then((password) => {
      const user = {
        email,
        password,
        token: jwt.sign(email, config.jwtSecret),
      };
      dbmanager.addUser(user)
        .then((dbuser) => {
          const userWithoutPassword = dbuser;
          userWithoutPassword.password = undefined;
          res.send(userWithoutPassword);
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

// todo: add password recovery
router.post('/recoverPassword', (req, res, next) => {
  next(new Error());
});

// Private API

router.use(auth.checkToken);

router.post('/manager', validate(validation.addManager), (req, res, next) => {
  const managerEmail = req.body.email;
  const userId = req.get('x-access-user-id');

  dbmanager.getUserById(userId)
    .then((owner) => {
      dbmanager.getUser({ email: managerEmail })
        .then(manager => ({ owner, manager }))
        .catch(err => next(err));
    })
    .then(({ owner, manager }) => {
      owner.managers.push(manager);
      owner.save()
        .then(() => {
          res.send(manager);
          // TODO: notify manager about being added
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

router.get('/managers', (req, res, next) => {
  const userId = req.get('x-access-user-id');

  dbmanager.getUserById(userId, 'managers', null, 'managers')
    .then(user => res.send(user.managers))
    .catch(err => next(err));
});

router.delete('/manager', validate(validation.deleteManager), (req, res, next) => {
  const managerId = req.body.managerId;
  const userId = req.get('x-access-user-id');

  dbmanager.getUserById(userId, 'managers', null)
    .then((user) => {
      const index = user.managers.indexOf(managerId);
      if (index > -1) {
        user.managers.splice(index, 1);
        user.save()
          .then(newUser => res.send(newUser))
          .catch(err => next(err));
      } else {
        next(errors.noManagerFound());
      }
    })
    .catch(err => next(err));
});

// Export

module.exports = router;
