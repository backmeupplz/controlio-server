const dbmanager = require('../helpers/dbmanager');
const hash = require('../helpers/hash');
const jwt = require('jsonwebtoken');
const config = require('../config');
const errors = require('../helpers/errors');
const auth = require('../helpers/auth');
const validate = require('express-validation');
const validation = require('../validation/users');
const router = require('express').Router(); // eslint-disable-line new-cap
const randomToken = require('random-token').create(config.randomTokenSalt);

// Public API

router.post('/requestMagicLink', validate(validation.magicLink), (req, res, next) => {
  const email = req.body.email;
  dbmanager.getUser({ email })
    .then((user) => {
      if (!user) {
        const user = {
          email,
        };
        dbmanager.addUser(user)
          .then((dbuser) => {
            const token = randomToken(24);
            dbuser.magicToken = token;
            global.emailSender.sendMagicLink(dbuser, token);
            dbuser.save()
              .then(() => res.sendStatus(200))
              .catch(err => next(err));
          })
          .catch(err => next(err));
      } else {
        const token = randomToken(24);
        user.magicToken = token;
        global.emailSender.sendMagicLink(user, token);
        user.save()
          .then(() => res.sendStatus(200))
          .catch(err => next(err));
      }
    })
    .catch(err => next(err));
});

router.post('/loginMagicLink', validate(validation.loginMagicLink), (req, res, next) => {
  const userId = req.body.userid;
  const token = req.body.token;

  dbmanager.getUserById(userId, '+token')
    .then((user) => {
      if (!user) {
        next(errors.noUserFound());
      } else {
        if (user.magicToken !== token) {
          next(errors.magicLinkOnlyOnce());
        } else {
          user.magicToken = null;
          user.save();
          user.password = undefined;
          res.send(user);
        }
      }
    })
    .catch(err => next(err));
});

router.post('/login', validate(validation.login), (req, res, next) => {
  const email = req.body.email;
  const rawPassword = req.body.password;
  const iosPushToken = req.body.iosPushToken;

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
              if (!user.token || iosPushToken) {
                if (!user.token) {
                  user.token = jwt.sign(email, config.jwtSecret);
                }
                if (iosPushToken) {
                  user.iosPushTokens.push(iosPushToken);
                }
                user.save()
                  .then((user) => {
                    user.password = undefined;
                    res.send(user);
                  })
                  .catch(err => ndext(err));
              } else {
                user.password = undefined;
                res.send(user);
              }
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
  const iosPushToken = req.body.iosPushToken;

  hash.hashPassword(rawPassword)
    .then((password) => {
      const user = {
        email,
        password,
        token: jwt.sign(email, config.jwtSecret),
      };
      if (iosPushToken) {
        user.iosPushTokens = [iosPushToken];
      }
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

router.post('/recoverPassword', validate(validation.resetPassword), (req, res, next) => {
  const email = req.body.email;

  dbmanager.getUser({ email })
    .then((user) => {
      if (!user) {
        next(errors.authEmailNotRegistered());
      } else {
        const token = randomToken(24);
        user.tokenForPasswordReset = token;
        user.tokenForPasswordResetIsFresh = true;
        global.emailSender.sendResetPassword(user, token);
        user.save()
          .then(() => res.sendStatus(200))
          .catch(err => next(err));
      }
    })
    .catch(err => next(err));
});

// Private API

router.use(auth.checkToken);

router.post('/logout', (req, res, next) => {
  const userId = req.get('userId');
  const iosPushToken = req.body.iosPushToken;

  dbmanager.getUserById(userId)
    .then(user => {
      user.iosPushTokens.splice(user.iosPushTokens.indexOf(iosPushToken), 1);
      user.save()
        .then(user => res.send(user))
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

router.get('/profile', (req, res, next) => {
  const userId = req.get('userId');

  dbmanager.getUserById(userId)
    .then(user => res.send(user))
    .catch(err => next(err));
});

router.post('/profile', (req, res, next) => {
  const userId = req.get('userId');

  const name = req.body.name;
  const phone = req.body.phone;
  const photo = req.body.photo;

  dbmanager.getUserById(userId, '+token')
    .then((user) => {
      user.name = name;
      user.phone = phone;
      user.photo = photo;
      return user.save()
        .then(newUser => res.send(newUser));
    })
    .catch(err => next(err));
});

router.post('/manager', validate(validation.addManager), (req, res, next) => {
  const managerEmail = req.body.email;
  const userId = req.get('userId');

  dbmanager.getUserById(userId)
    .then(owner =>
      dbmanager.getUser({ email: managerEmail })
        .then(manager => ({ owner, manager }))
    )
    .then(({ owner, manager }) => {
      if (manager) {
        if (manager.email === owner.email) {
          next(errors.addSelfAsManager());
        } else if (owner.managers.map(v => String(v)).includes(String(manager._id))) {
          next(errors.alreadyManager());
        } else {
          owner.managers.push(manager);
          owner.save()
            .then(() => {
              res.send(manager);
              // TODO: notify manager about being added
            })
            .catch(err => next(err));
        }
      } else {
        dbmanager.addManager(managerEmail)
          .then((newManager) => {
            owner.managers.push(newManager);
            owner.save()
              .then(() => {
                res.send(newManager);
                // TODO: notify manager about being added and registered to the system
              })
              .catch(err => next(err));
          })
          .catch(err => next(err));
      }
    })
    .catch(err => next(err));
});

router.get('/managers', (req, res, next) => {
  const userId = req.get('userId');

  dbmanager.getUserById(userId, null, null, 'managers')
    .then((user) => {
      user.managers.unshift(user);
      res.send(user.managers);
    })
    .catch(err => next(err));
});

router.delete('/manager', validate(validation.deleteManager), (req, res, next) => {
  const managerId = req.body.id;
  const userId = req.get('userId');

  dbmanager.getUserById(userId, 'managers projects', null, 'projects')
    .then(user =>
      dbmanager.getUserById(managerId)
        .then(manager => dbmanager.removeManagerFromOwner(manager, user))
    )
    .then(user => res.send(user))
    .catch(err => next(err));
});

// Export

module.exports = router;
