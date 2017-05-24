/** Dependencies */
const db = require('../helpers/db');
const hash = require('../helpers/hash');
const jwt = require('../helpers/jwt');
const errors = require('../helpers/errors');
const auth = require('../helpers/auth');
const validate = require('express-validation');
const validation = require('../validation/users');
const router = require('express').Router();
const reporter = require('../helpers/reporter');
const mailer = require('../helpers/mailer');
const _ = require('lodash');
const demo = require('../helpers/demo');
const passport = require('passport');
const FacebookTokenStrategy = require('passport-facebook-token');

/** Configure faacebook passport */
passport.use(new FacebookTokenStrategy({
  clientID: '168986530293704',
  clientSecret: '0ea97f4d7a7d7ded8a67342f108e32d5',
}, (accessToken, refreshToken, profile, done) => {
  profile.accessToken = accessToken;
  done(null, profile);
}));

/** Public API */

/** Method to request magic link email */
router.post('/requestMagicLink', validate(validation.magicLink), (req, res, next) => {
  const email = req.body.email.toLowerCase();

  db.findUser({ email })
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
        });
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

  const { error, data } = jwt.verify(token);
  if (error) {
    return next(error);
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
        });
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
    .catch(err => next(err));
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
        });
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

/** Method for login with facebook */
router.post('/loginFacebook',
validate(validation.loginFacebook),
passport.authenticate('facebook-token', { session: false }),
(req, res, next) => {
  const email = req.user.emails[0].value;
  const name = req.user.displayName;
  if (!email) {
    return next(errors.authEmailNotRegistered());
  }
  const iosPushToken = req.body.iosPushToken;
  const androidPushToken = req.body.androidPushToken;
  const webPushToken = req.body.webPushToken;

  db.findUser({ email })
    .select('email token isDemo isAdmin iosPushTokens androidPushTokens webPushTokens stripeId stripeSubscriptionId plan name photo')
    /** Check if user exists */
    .then((user) => {
      if (user) {
        return user;
      }
      const newUser = { email };
      if (iosPushToken) {
        newUser.iosPushTokens = [iosPushToken];
      }
      if (androidPushToken) {
        newUser.androidPushTokens = [androidPushToken];
      }
      if (webPushToken) {
        newUser.webPushTokens = [webPushToken];
      }
      return db.addUser(newUser);
    })
    /** Add token if missing */
    .then((user) => {
      // TODO: add photo here as well
      if (!user.name) {
        user.name = name;
        return user.save();
      }
      if (!user.token) {
        user.token = jwt.sign({
          email,
          userid: user._id,
        });
        return user.save();
      }
      return user;
    })
    /** Save user and return without password */
    .then((user) => {
      res.send(_.pick(user, ['_id', 'token', 'email', 'isDemo', 'isAdmin', 'plan', 'stripeId', 'stripeSubscriptionId', 'name', 'photo']));
    })
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
          });
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

  const p = db.findUser({ email })
    .select('email')
    /** Check user existence */
    .then((user) => {
      if (!user) {
        p.cancel();
        return next(errors.authEmailNotRegistered());
      }
      return user;
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

  const { error, data } = jwt.verify(token);
  if (error) {
    return next(error);
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
    .catch(err => next(err));
});

/** Private API check */
router.use(auth.checkToken);

/** Method to remove the specified push notifications token */
router.post('/logout', (req, res, next) => {
  const iosPushToken = req.body.iosPushToken;
  const androidPushToken = req.body.androidPushToken;
  const webPushToken = req.body.webPushToken;

  req.user.iosPushTokens = req.user.iosPushTokens.filter(v => v !== iosPushToken);
  req.user.androidPushTokens = req.user.androidPushTokens.filter(v => v !== androidPushToken);
  req.user.webPushTokens = req.user.webPushTokens.filter(v => v !== webPushToken);

  reporter.reportLogout(req.user);

  req.user.save()
    .then(() => res.send({ success: true }))
    .catch(err => next(err));
});

router.post('/changeAndroidToken', (req, res, next) => {
  const androidPushToken = req.body.androidPushToken;
  const oldAndroidPushToken = req.body.oldAndroidPushToken;

  req.user.androidPushTokens = req.user.androidPushTokens.filter(v => v !== oldAndroidPushToken);
  req.user.androidPushTokens.push(androidPushToken);

  req.user.save()
    .then(() => res.send({ success: true }))
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
router.post('/profile', validate(validation.editProfile), demo.checkDemo, (req, res, next) => {
  const userId = req.user._id;

  const name = req.body.name;
  const phone = req.body.phone;
  const photo = req.body.photo;

  db.findUserById(userId)
    .select('token email name phone photo plan stripeId')
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
