/** Dependencies */
const db = require('../helpers/db');
const hash = require('../helpers/hash');
const jwt = require('jsonwebtoken');
const config = require('../config');
const errors = require('../helpers/errors');
const auth = require('../helpers/auth');
const validate = require('express-validation');
const validation = require('../validation/users');
const router = require('express').Router();
const reporter = require('../helpers/reporter');
const mailer = require('../helpers/mailer');
const _ = require('lodash');

/** Public API */

/** Method to request magic link email */
router.post('/requestMagicLink', validate(validation.magicLink), (req, res, next) => {
  const email = req.body.email.toLowerCase();

  db.findUser({ email })
    .select('email')
    /** If user doesn't exist, we create one */
    .then((user) => {
      if (user) {
        return user;
      }
      return db.addUser({
        email,
      }).then((dbuser) => {
        dbuser.token = jwt.sign({
          email,
          userid: dbuser._id,
        }, config.jwtSecret);
        return dbuser.save();
      });
    })
    .then((user) => {
      user.generateMagicToken(user);
      reporter.reportMagicLinkRequest(user);
      mailer.sendMagicLink(user);
      return user.save()
        .then(() => res.send({ success: true }));
    })
    .catch(err => next(err));
});

/** Method to try to login with the magic link */
router.post('/loginMagicLink', validate(validation.loginMagicLink), (req, res, next) => {
  const token = req.body.token;
  const iosPushToken = req.body.iosPushToken;
  const androidPushToken = req.body.androidPushToken;
  const webPushToken = req.body.webPushToken;

  jwt.verify(token, config.jwtSecret, (err, data) => {
    if (err) {
      return next(err);
    }
    if (!data || !data.userid) {
      return next(errors.authTokenFailed());
    }
    const userId = data.userid;
    db.findUserById(userId)
      .select('email token isDemo isAdmin magicToken iosPushTokens androidPushTokens webPushTokens stripeId stripeSubscriptionId plan name photo')
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
        if (!user.token) {
          user.token = jwt.sign({
            email: user.email,
            userid: user._id,
          }, config.jwtSecret);
        }
        return user;
      })
      /** Add push tokens if provided */
      .then((user) => {
        if (user.isDemo) {
          return user;
        }
        if (iosPushToken) {
          user.iosPushTokens.push(iosPushToken);
        }
        user.iosPushTokens = _.uniq(user.iosPushTokens);
        if (androidPushToken) {
          user.androidPushTokens.push(androidPushToken);
        }
        user.androidPushTokens = _.uniq(user.androidPushTokens);
        if (webPushToken) {
          user.webPushTokens.push(webPushToken);
        }
        user.webPushTokens = _.uniq(user.webPushTokens);
        return user;
      })
      /** Login */
      .then((user) => {
        user.magicToken = null;

        return user.save()
          .then((savedUser) => {
            const savedUserCopy = _.pick(savedUser, ['_id', 'token', 'email', 'isDemo', 'isAdmin', 'plan', 'stripeId', 'stripeSubscriptionId']);
            res.send(savedUserCopy);
            reporter.reportMagicLinkLogin(savedUserCopy);
          });
      })
      .catch(error => next(error));
  });
});

/** Method for usual login with email and password */
router.post('/login', validate(validation.login), (req, res, next) => {
  const email = req.body.email.toLowerCase();
  const rawPassword = req.body.password;
  const iosPushToken = req.body.iosPushToken;
  const androidPushToken = req.body.androidPushToken;
  const webPushToken = req.body.webPushToken;

  db.findUser({ email })
    .select('email password token isDemo isAdmin iosPushTokens androidPushTokens webPushTokens stripeId stripeSubscriptionId plan name photo')
    /** Check if user exists */
    .then((user) => {
      if (!user) {
        throw errors.authEmailNotRegistered();
      } else if (!user.password) {
        user.generateResetPasswordToken(user);
        user.save();
        mailer.sendSetPassword(user);
        throw errors.passwordNotExist();
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
        userCopy.token = jwt.sign({
          email,
          userid: userCopy._id,
        }, config.jwtSecret);
      }
      return userCopy;
    })
    /** Add push tokens if provided */
    .then((user) => {
      if (user.isDemo) {
        return user;
      }
      if (iosPushToken) {
        user.iosPushTokens.push(iosPushToken);
      }
      user.iosPushTokens = _.uniq(user.iosPushTokens);
      if (androidPushToken) {
        user.androidPushTokens.push(androidPushToken);
      }
      user.androidPushTokens = _.uniq(user.androidPushTokens);
      if (webPushToken) {
        user.webPushTokens.push(webPushToken);
      }
      user.webPushTokens = _.uniq(user.webPushTokens);
      return user;
    })
    /** Save user and return without password */
    .then(user =>
      user.save()
        .then((savedUser) => {
          const savedUserCopy = _.pick(savedUser, ['_id', 'token', 'email', 'isDemo', 'isAdmin', 'plan', 'stripeId', 'stripeSubscriptionId', 'name', 'photo']);
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
      return db.addUser(user)
        .then((dbuser) => {
          dbuser.token = jwt.sign({
            email: dbuser.email,
            userid: dbuser._id,
          }, config.jwtSecret);
          return dbuser.save();
        })
        .then((dbuser) => {
          const dbuserCopy = _.pick(dbuser, ['_id', 'token', 'email', 'isDemo', 'isAdmin', 'plan', 'stripeId', 'stripeSubscriptionId', 'name', 'photo']);
          res.send(dbuserCopy);
          mailer.sendSignup(user.email);
          reporter.reportSignUp(user);
        });
    })
    .catch(err => next(err));
});

/** Method to send restore email password */
router.post('/recoverPassword', validate(validation.resetPassword), (req, res, next) => {
  const email = req.body.email;

  db.findUser({ email })
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
      user.generateResetPasswordToken(user);
      reporter.reportPasswordResetRequest(user);
      mailer.sendResetPassword(user);
      return user.save()
        .then(() => res.send({ success: true }));
    })
    .catch(err => next(err));
});

/** Method to reset password */
router.post('/resetPassword', validate(validation.postResetPassword), (req, res, next) => {
  const password = req.body.password;
  const token = req.body.token;

  jwt.verify(token, config.jwtSecret, (err, data) => {
    if (err) {
      return next(err);
    }
    if (!data || !data.userid) {
      return next(errors.authTokenFailed());
    }

    const userId = data.userid;
    db.findUserById(userId)
      .select('tokenForPasswordResetIsFresh tokenForPasswordReset')
        .then((user) => {
          if (!user) {
            throw errors.noUserFound();
          } else if (user.tokenForPasswordReset !== token) {
            throw errors.wrongResetToken();
          } else {
            return hash.hashPassword(password)
              .then((result) => {
                user.tokenForPasswordReset = null;
                user.password = result;
                return user.save()
                  .then(() => {
                    reporter.reportResetPassword(user);
                    res.send({ success: true });
                  });
              });
          }
        })
        .catch(error => next(error));
  });
});

/** Private API check */
router.use(auth.checkToken);

/** Method to remove the specified push notifications token */
router.post('/logout', (req, res, next) => {
  const userId = req.user._id;
  const iosPushToken = req.body.iosPushToken;

  db.findUserById(userId)
    .then((user) => {
      user.iosPushTokens.filter(v => v !== iosPushToken);

      reporter.reportLogout(user);

      user.save()
        .then(() => res.send({ success: true }))
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

/** Method to get user's profile */
router.get('/profile', (req, res, next) => {
  const userId = req.query.id || req.user._id;

  db.getProfile(userId)
    .then(user => res.send(user))
    .catch(err => next(err));
});

/** Method to edit user's profile */
router.post('/profile', validate(validation.editProfile), (req, res, next) => {
  const userId = req.user._id;

  const name = req.body.name;
  const phone = req.body.phone;
  const photo = req.body.photo;

  db.findUserById(userId)
    .select('token email name phone photo plan')
    .then((user) => {
      const userCopy = _.clone(user);
      userCopy.name = name;
      userCopy.phone = phone;
      userCopy.photo = photo;
      return userCopy.save()
        .then((savedUser) => {
          reporter.reportEditProfile(savedUser);

          res.send(savedUser);
        });
    })
    .catch(err => next(err));
});

/** Export */
module.exports = router;
