/** Dependencies */
const dbmanager = require('../helpers/dbmanager');
const hash = require('../helpers/hash');
const jwt = require('jsonwebtoken');
const config = require('../config');
const errors = require('../helpers/errors');
const auth = require('../helpers/auth');
const validate = require('express-validation');
const validation = require('../validation/users');
const router = require('express').Router();
const randomToken = require('random-token').create(config.randomTokenSalt);
const botReporter = require('../helpers/botReporter');
const emailSender = require('../helpers/emailSender');
const _ = require('lodash');

/** Public API */

/** Method to request magic link email */
router.post('/requestMagicLink', validate(validation.magicLink), (req, res, next) => {
  const email = req.body.email.toLowerCase();

  botReporter.reportMagicLinkRequest(email);

  dbmanager.findUser({ email })
    .select('email')
    /** If user doesn't exist, we create one */
    .then((user) => {
      if (user) {
        return user;
      }
      return dbmanager.addUser({
        email,
        token: jwt.sign(email, config.jwtSecret),
      });
    })
    .then((user) => {
      const userCopy = _.clone(user);
      userCopy.magicToken = randomToken(24);
      emailSender.sendMagicLink(userCopy);
      return userCopy.save()
        .then(() => res.send({ success: true }));
    })
    .catch(err => next(err));
});

/** Method to try to login with the magic link */
router.post('/loginMagicLink', validate(validation.loginMagicLink), (req, res, next) => {
  const userId = req.body.userid;
  const token = req.body.token;
  const iosPushToken = req.body.iosPushToken;
  const androidPushToken = req.body.androidPushToken;
  const webPushToken = req.body.webPushToken;

  dbmanager.findUserById(userId)
    .select('email token isDemo isAdmin plan magicToken')
    /** Check if user exists */
    .then((user) => {
      if (!user) {
        throw errors.noUserFound();
      } else {
        return user;
      }
    })
    /** Check if magic tokens match */
    .then((user) => {
      if (!user.magicToken || user.magicToken !== token) {
        throw errors.magicLinkOnlyOnce();
      } else {
        return user;
      }
    })
    /** Add token if missing */
    .then((user) => {
      const userCopy = _.clone(user);
      if (!userCopy.token) {
        userCopy.token = jwt.sign(userCopy.email, config.jwtSecret);
      }
      return userCopy;
    })
    /** Add push tokens if provided */
    .then((user) => {
      const userCopy = _.clone(user);
      if (userCopy.isDemo) {
        return userCopy;
      }
      if (iosPushToken) {
        userCopy.iosPushTokens.push(iosPushToken);
      }
      if (androidPushToken) {
        userCopy.androidPushTokens.push(androidPushToken);
      }
      if (webPushToken) {
        userCopy.webPushTokens.push(webPushToken);
      }
      return userCopy;
    })
    /** Login */
    .then((user) => {
      const userCopy = _.clone(user);

      userCopy.magicToken = null;

      return userCopy.save()
        .then((savedUser) => {
          const savedUserCopy = _.pick(savedUser, ['_id', 'token', 'email', 'isDemo', 'isAdmin', 'plan']);
          res.send(savedUserCopy);
          botReporter.reportMagicLinkLogin(savedUserCopy.email);
        });
    })
    .catch(err => next(err));
});

/** Method for usual login with email and password */
router.post('/login', validate(validation.login), (req, res, next) => {
  const email = req.body.email.toLowerCase();
  const rawPassword = req.body.password;
  const iosPushToken = req.body.iosPushToken;
  const androidPushToken = req.body.androidPushToken;
  const webPushToken = req.body.webPushToken;

  dbmanager.findUser({ email })
    .select('email password token isDemo isAdmin plan')
    /** Check if user exists */
    .then((user) => {
      if (!user) {
        throw errors.authEmailNotRegistered();
      } else {
        return user;
      }
    })
    /** Check password */
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
    /** Add token if missing */
    .then((user) => {
      const userCopy = _.clone(user);
      if (!userCopy.token) {
        userCopy.token = jwt.sign(email, config.jwtSecret);
      }
      return userCopy;
    })
    /** Add push tokens if provided */
    .then((user) => {
      const userCopy = _.clone(user);
      if (userCopy.isDemo) {
        return userCopy;
      }
      if (iosPushToken) {
        userCopy.iosPushTokens.push(iosPushToken);
      }
      if (androidPushToken) {
        userCopy.androidPushTokens.push(androidPushToken);
      }
      if (webPushToken) {
        userCopy.webPushTokens.push(webPushToken);
      }
      return userCopy;
    })
    /** Save user and return without password */
    .then(user =>
      user.save()
        .then((savedUser) => {
          const savedUserCopy = _.pick(savedUser, ['_id', 'token', 'email', 'isDemo', 'isAdmin', 'plan']);
          res.send(savedUserCopy);
        })
    )
    .catch(err => next(err));
});

/** Method to signup user */
router.post('/signUp', validate(validation.signup), (req, res, next) => {
  const email = req.body.email.toLowerCase();
  const rawPassword = req.body.password;
  const iosPushToken = req.body.iosPushToken;
  const androidPushToken = req.body.androidPushToken;
  const webPushToken = req.body.webPushToken;

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
      if (androidPushToken) {
        user.androidPushTokens = [androidPushToken];
      }
      if (webPushToken) {
        user.webPushTokens = [webPushToken];
      }
      return dbmanager.addUser(user)
        .then((dbuser) => {
          const dbuserCopy = _.pick(dbuser, ['_id', 'token', 'email', 'isDemo', 'isAdmin', 'plan']);
          res.send(dbuserCopy);

          botReporter.reportSignUp(email);
        });
    })
    .catch(err => next(err));
});

/** Method to send restore email password */
router.post('/recoverPassword', validate(validation.resetPassword), (req, res, next) => {
  const email = req.body.email;

  botReporter.reportPasswordResetRequest(email);

  dbmanager.findUser({ email })
    .select('email')
    /** Check user existence */
    .then((user) => {
      if (!user) {
        next(errors.authEmailNotRegistered());
      } else {
        return user;
      }
    })
    /** Save tokens and send email */
    .then((user) => {
      const userCopy = _.clone(user);
      userCopy.tokenForPasswordReset = randomToken(24);
      userCopy.tokenForPasswordResetIsFresh = true;
      emailSender.sendResetPassword(userCopy);
      return userCopy.save()
        .then(() => res.send({ success: true }));
    })
    .catch(err => next(err));
});

/** Private API check */
router.use(auth.checkToken);

/** Method to remove the specified push notifications token */
router.post('/logout', (req, res, next) => {
  const userId = req.get('userId');
  const iosPushToken = req.body.iosPushToken;

  dbmanager.findUserById(userId)
    .then((user) => {
      user.iosPushTokens.filter(v => v !== iosPushToken);

      botReporter.reportLogout(user.email);

      user.save()
        .then(dbuser => res.send({ success: true }))
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

/** Method to get user's profile */
router.get('/profile', (req, res, next) => {
  const userId = req.query.id || req.get('userId');

  dbmanager.getProfile(userId)
    .then(user => res.send(user))
    .catch(err => next(err));
});

/** Method to edit user's profile */
router.post('/profile', validate(validation.editProfile), (req, res, next) => {
  const userId = req.get('userId');

  const name = req.body.name;
  const phone = req.body.phone;
  const photo = req.body.photo;

  dbmanager.findUserById(userId)
    .select('token email name phone photo')
    .then((user) => {
      const userCopy = _.clone(user);
      userCopy.name = name;
      userCopy.phone = phone;
      userCopy.photo = photo;
      return userCopy.save()
        .then((savedUser) => {
          botReporter.reportEditProfile(savedUser);

          res.send(savedUser);
        });
    })
    .catch(err => next(err));
});

/** Export */
module.exports = router;
