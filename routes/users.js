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
  const email = req.body.email.toLowerCase();

  global.botReporter.reportMagicLinkRequest(email);

  dbmanager.getUser({ email })
    .then((user) => {
      if (!user) {
        return dbmanager.addUser({
          email,
          token: jwt.sign(email, config.jwtSecret),
        });
      }
      return user;
    })
    .then((user) => {
      const userCopy = Object.create(user);
      userCopy.magicToken = randomToken(24);
      global.emailSender.sendMagicLink(userCopy);
      return userCopy.save()
        .then(() => res.send({ success: true }));
    })
    .catch(err => next(err));
});

router.post('/loginMagicLink', validate(validation.loginMagicLink), (req, res, next) => {
  const userId = req.body.userid;
  const token = req.body.token;
  const iosPushToken = req.body.iosPushToken;

  dbmanager.getUserById(userId, '+token')
    .then((user) => {
      if (!user) {
        throw errors.noUserFound();
      } else {
        return user;
      }
    })
    .then((user) => {
      if (user.magicToken !== token) {
        throw errors.magicLinkOnlyOnce();
      } else {
        return user;
      }
    })
    .then((user) => {
      const userCopy = Object.create(user);
      if (!userCopy.token) {
        userCopy.token = jwt.sign(userCopy.email, config.jwtSecret);
      }
      if (iosPushToken && !user.isDemo) {
        userCopy.iosPushTokens.push(iosPushToken);
      }
      userCopy.magicToken = null;

      return userCopy.save()
        .then((savedUser) => {
          const savedUserCopy = Object.create(savedUser);
          savedUserCopy.password = undefined;
          res.send(savedUserCopy);
          global.botReporter.reportMagicLinkLogin(savedUserCopy.email);
        });
    })
    .catch(err => next(err));
});

router.post('/login', validate(validation.login), (req, res, next) => {
  const email = req.body.email.toLowerCase();
  const rawPassword = req.body.password;
  const iosPushToken = req.body.iosPushToken;

  const p = dbmanager.getUser({ email }, '+password +token')
    .then((user) => {
      if (!user) {
        throw errors.authEmailNotRegistered();
      } else {
        return user;
      }
    })
    .then(user =>
      hash.checkPassword(user.password, rawPassword)
        .then((result) => {
          if (!result) {
            throw errors.authWrongPassword();
          } else {
            return user;
          }
        })
    )
    .then((user) => {
      const userCopy = Object.create(user);
      if (userCopy.token && (!iosPushToken || user.isDemo)) {
        userCopy.password = undefined;
        res.send(userCopy);
        global.botReporter.reportLogin(userCopy.email);
        p.cancel();
      } else {
        return userCopy;
      }
    })
    .then((user) => {
      const userCopy = Object.create(user);
      if (!userCopy.token) {
        userCopy.token = jwt.sign(email, config.jwtSecret);
      }
      if (iosPushToken && !user.isDemo) {
        userCopy.iosPushTokens.push(iosPushToken);
      }
      return userCopy.save()
        .then((savedUser) => {
          const savedUserCopy = Object.create(savedUser);
          savedUserCopy.password = undefined;
          res.send(savedUserCopy);
        });
    })
    .catch(err => next(err));
});

router.post('/signUp', validate(validation.signup), (req, res, next) => {
  const email = req.body.email.toLowerCase();
  const rawPassword = req.body.password;
  const iosPushToken = req.body.iosPushToken;

  hash.hashPassword(rawPassword)
    .then((password) => {
      const user = {
        email,
        password,
        token: jwt.sign(email, config.jwtSecret),
      };
      if (iosPushToken && !user.isDemo) {
        user.iosPushTokens = [iosPushToken];
      }
      return dbmanager.addUser(user)
        .then((dbuser) => {
          const dbuserCopy = Object.create(dbuser);
          dbuserCopy.password = undefined;
          res.send(dbuserCopy);
          global.botReporter.reportSignUp(email);
        });
    })
    .catch(err => next(err));
});

router.post('/recoverPassword', validate(validation.resetPassword), (req, res, next) => {
  const email = req.body.email.toLowerCase();

  global.botReporter.reportPasswordResetRequest(email);

  dbmanager.getUser({ email })
    .then((user) => {
      if (!user) {
        next(errors.authEmailNotRegistered());
      } else {
        return user;
      }
    })
    .then((user) => {
      const userCopy = Object.create(user);
      userCopy.tokenForPasswordReset = randomToken(24);
      userCopy.tokenForPasswordResetIsFresh = true;
      global.emailSender.sendResetPassword(userCopy);
      return userCopy.save()
        .then(() => res.send({ success: true }));
    })
    .catch(err => next(err));
});

// Private API

router.use(auth.checkToken);

router.post('/logout', (req, res, next) => {
  const userId = req.get('userId');
  const iosPushToken = req.body.iosPushToken;

  dbmanager.getUserById(userId)
    .then((user) => {
      const userCopy = Object.create(user);
      userCopy.iosPushTokens.splice(userCopy.iosPushTokens.indexOf(iosPushToken), 1);

      global.botReporter.reportLogout(userCopy.email);

      userCopy.save()
        .then(dbuser => res.send(dbuser))
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

router.get('/profile', (req, res, next) => {
  const userId = req.get('userId');

  dbmanager.getUserById(userId)
    .then((user) => {
      global.botReporter.reportGetProfile(user.email);

      res.send(user);
    })
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
        .then((newUser) => {
          global.botReporter.reportEditProfile(newUser);

          res.send(newUser);
        });
    })
    .catch(err => next(err));
});

router.post('/manager', validate(validation.addManager), (req, res, next) => {
  const managerEmail = req.body.email.toLowerCase();
  const userId = req.get('userId');

  if (managerEmail === 'giraffe@controlio.co') {
    next(errors.addDemoAsManager());
    return;
  }

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
              global.botReporter.reportAddManager(owner, manager);

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
                global.botReporter.reportAddManager(owner, newManager);
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
      global.botReporter.reportGetManagers(user.email);

      user.managers.unshift(user);
      const result = user.managers;
      result[0].managers = result[0].managers.map(v => v._id);
      res.send(result);
    })
    .catch(err => next(err));
});

router.delete('/manager', validate(validation.deleteManager), (req, res, next) => {
  const managerId = req.body.id;
  const userId = req.get('userId');

  if (managerId === userId) {
    next(errors.removeYourselfAsManager());
    return;
  }

  dbmanager.getUserById(userId, null, null, 'projects')
    .then(user =>
      dbmanager.getUserById(managerId)
        .then((manager) => {
          global.botReporter.reportDeleteManager(user, manager);

          return dbmanager.removeManagerFromOwner(manager, user);
        })
    )
    .then(() => res.send({ success: true }))
    .catch(err => next(err));
});

router.post('/convertToBusiness', (req, res, next) => {
  const userId = req.get('userId');
  dbmanager.convertToBusiness(userId, true)
    .then(() => res.send({ success: true }))
    .catch(err => next(err));
});

router.post('/convertFromBusiness', (req, res, next) => {
  const userId = req.get('userId');

  dbmanager.convertToBusiness(userId, false)
    .then(() => res.send({ success: true }))
    .catch(err => next(err));
});

// Export

module.exports = router;
