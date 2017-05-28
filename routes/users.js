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
router.post('/requestMagicLink',
validate(validation.magicLink),
async (req, res, next) => {
  try {
    /** Get req parameters */
    const email = req.body.email.toLowerCase();
    /** Get user from db */
    let user = await db.findUser({ email });
    /** Create new user if none found */
    if (!user) {
      user = await db.addUser({ email });
      user.token = jwt.sign({
        email,
        userid: user._id,
      });
      user = await user.save();
    }
    /** Do some stuff with user */
    user.generateMagicToken(user);
    reporter.reportMagicLinkRequest(user);
    mailer.sendMagicLink(user);
    /** Save user after that */
    user = await user.save();
    /** Send success */
    res.send({ success: true });
  } catch (err) {
    next(err);
  }
});

/** Method to try to login with the magic link */
router.post('/loginMagicLink',
validate(validation.loginMagicLink),
async (req, res, next) => {
  try {
    /** Get req parameters */
    const token = req.body.token;
    const iosPushToken = req.body.iosPushToken;
    const androidPushToken = req.body.androidPushToken;
    const webPushToken = req.body.webPushToken;
    /** Try to verify auth token */
    const { error, data } = jwt.verify(token);
    /** Throw error if failed to verify magic token */
    if (error) {
      throw error;
    }
    /** Throw error if verification of magic token returned nothing */
    if (!data || !data.userid) {
      throw errors.authTokenFailed();
    }
    /** Get user id from magic token */
    const userId = data.userid;
    /** Get user from db */
    let user = await db.findUserById(userId)
      .select('email token isDemo isAdmin magicToken iosPushTokens androidPushTokens webPushTokens stripeId stripeSubscriptionId plan name photo');
    /** Throw error if no user found */
    if (!user) {
      throw errors.noUserFound();
    }
    /** Check if magic tokens match */
    if (!user.magicToken || user.magicToken !== token) {
      throw errors.magicLinkOnlyOnce();
    }
    /** Check if user has jwt (if not, create one) */
    if (!user.token) {
      user.token = jwt.sign({
        email: user.email,
        userid: user._id,
      });
    }
    /** Add push tokens if provided */
    user.addPushTokens(iosPushToken, androidPushToken, webPushToken);
    /** Get final user object preparations and save it */
    user.magicToken = null;
    user = await user.save();
    user = user.filterProps;
    /** Send response */
    res.send(user);
    reporter.reportMagicLinkLogin(user);
  } catch (err) {
    next(err);
  }
});

/** Method for usual login with email and password */
router.post('/login',
validate(validation.login),
async (req, res, next) => {
  try {
    /** Get req parameters */
    const email = req.body.email.toLowerCase();
    const rawPassword = req.body.password;
    const iosPushToken = req.body.iosPushToken;
    const androidPushToken = req.body.androidPushToken;
    const webPushToken = req.body.webPushToken;
    /** Getting user from the db */
    let user = await db.findUser({ email })
      .select('email password token isDemo isAdmin iosPushTokens androidPushTokens webPushTokens stripeId stripeSubscriptionId plan name photo');
    /** Throw an error if no user exist */
    if (!user) {
      throw errors.authEmailNotRegistered();
    }
    /** Handle the case when user don't have a password set */
    if (!user.password) {
      user.generateResetPasswordToken();
      user.save();
      mailer.sendSetPassword(user);
      throw errors.passwordNotExist();
    }
    /** Check password */
    const isValidPassword = await hash.checkPassword(user.password, rawPassword);
    if (!isValidPassword) {
      throw errors.authWrongPassword();
    }
    /** Add jwt if missing */
    if (!user.token) {
      user.token = jwt.sign({
        email,
        userid: user._id,
      });
    }
    /** Add push tokens if provided */
    user.addPushTokens(iosPushToken, androidPushToken, webPushToken);
    /** Save user and return without password */
    user = await user.save();
    user = user.filterProps;
    res.send(user);
  } catch (err) {
    next(err);
  }
});

/** Method for login with facebook */
router.post('/loginFacebook',
validate(validation.loginFacebook),
passport.authenticate('facebook-token', { session: false }),
async (req, res, next) => {
  try {
    /** Get req parameters */
    const email = req.user.emails[0].value;
    const name = req.user.displayName;
    const iosPushToken = req.body.iosPushToken;
    const androidPushToken = req.body.androidPushToken;
    const webPushToken = req.body.webPushToken;
    /** Check if email is returned from FB */
    if (!email) {
      throw errors.authEmailNotRegistered();
    }
    /** Get user from db */
    let user = await db.findUser({ email })
      .select('email token isDemo isAdmin iosPushTokens androidPushTokens webPushTokens stripeId stripeSubscriptionId plan name photo');
    /** If no user exists, create one */
    if (!user) {
      user = await db.addUser({ email });
    }
    /** Add push tokens if provided */
    user.addPushTokens(iosPushToken, androidPushToken, webPushToken);
    /** Add jwt if missing */
    if (!user.token) {
      user.token = jwt.sign({
        email,
        userid: user._id,
      });
    }
    /** Add DB name if possible and required */
    // TODO: add photo here as well
    if (!user.name) {
      user.name = name;
    }
    /** Save user and return without password */
    user = await user.save();
    user = user.filterProps;
    res.send(user);
  } catch (err) {
    next(err);
  }
});

/** Method to signup user */
router.post('/signUp',
validate(validation.signup),
async (req, res, next) => {
  try {
    /** Get req parameters */
    const email = req.body.email.toLowerCase();
    const rawPassword = req.body.password;
    const iosPushToken = req.body.iosPushToken;
    const androidPushToken = req.body.androidPushToken;
    const webPushToken = req.body.webPushToken;
    /** Hash password */
    const password = await hash.hashPassword(rawPassword);
    /** Add user to the db */
    let user = await db.addUser({ email, password });
    /** Add push tokens if provided */
    user.addPushTokens(iosPushToken, androidPushToken, webPushToken);
    /** Add jwt */
    user.token = jwt.sign({
      email,
      userid: user._id,
    });
    /** Save user and return without password */
    user = await user.save();
    user = user.filterProps;
    res.send(user);
    /** Do some marketing stuff */
    mailer.sendSignup(user.email);
    reporter.reportSignUp(user);
  } catch (err) {
    next(err);
  }
});

/** Method to send restore email password */
router.post('/recoverPassword',
validate(validation.resetPassword),
async (req, res, next) => {
  try {
    /** Get req parameters */
    const email = req.body.email;
    /** Getting user from db */
    let user = await db.findUser({ email }).select('email');
    /** Throw error if no user found */
    if (!user) {
      throw errors.authEmailNotRegistered();
    }
    /** Save tokens and send email */
    user.generateResetPasswordToken();
    reporter.reportPasswordResetRequest(user);
    mailer.sendResetPassword(user);
    /** Save user */
    user = await user.save();
    /** Respond with success */
    res.send({ success: true });
  } catch (err) {
    next(err);
  }
});

/** Method to reset password */
router.post('/resetPassword',
validate(validation.postResetPassword),
async (req, res, next) => {
  try {
    /** Get req parameters */
    const password = req.body.password;
    const token = req.body.token;
    /** Try to verify reset password token */
    const { error, data } = jwt.verify(token);
    /** Throw an error if token is invalid */
    if (error) {
      throw error;
    }
    /** Throw an error if token had no data */
    if (!data || !data.userid) {
      throw errors.authTokenFailed();
    }
    /** Get user from db */
    const userId = data.userid;
    let user = await db.findUserById(userId)
      .select('tokenForPasswordResetIsFresh tokenForPasswordReset');
    /** Throw an error if no user found */
    if (!user) {
      throw errors.noUserFound();
    }
    /** Throw an error if password reset token is invalid */
    if (user.tokenForPasswordReset !== token) {
      throw errors.wrongResetToken();
    }
    /** Hash new password */
    const newPassword = await hash.hashPassword(password);
    user.tokenForPasswordReset = null;
    user.password = newPassword;
    /** Save user */
    user = await user.save();
    /** Respond with success */
    res.send({ success: true });
  } catch (err) {
    next(err);
  }
});

/** Private API check */
router.use(auth.checkToken);

/** Method to remove the specified push notifications token */
router.post('/logout',
async (req, res, next) => {
  try {
    /** Get req parameters */
    let user = req.user;
    const iosPushToken = req.body.iosPushToken;
    const androidPushToken = req.body.androidPushToken;
    const webPushToken = req.body.webPushToken;
    /** Remove push tokens if required */
    user.removePushTokens(iosPushToken, androidPushToken, webPushToken);
    /** Report logout */
    reporter.reportLogout(user);
    /** Save user */
    user = await user.save();
    /** Respond with success */
    res.send({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/changeAndroidToken',
async (req, res, next) => {
  try {
    /** Get req parameters */
    let user = req.user;
    const androidPushToken = req.body.androidPushToken;
    const oldAndroidPushToken = req.body.oldAndroidPushToken;
    /** Remove old and add new android token */
    user.removePushTokens(null, oldAndroidPushToken);
    user.addPushTokens(null, androidPushToken);
    /** Save user */
    user = await user.save();
    /** Respond with success */
    res.send({ success: true });
  } catch (err) {
    next(err);
  }
});

/** Method to get user's profile */
router.get('/profile',
async (req, res, next) => {
  try {
    /** Get req parameters */
    const userId = req.query.id || req.user._id;
    /** Fetch profile */
    const profile = await db.getProfile(userId);
    /** Respond with profile */
    res.send(profile);
  } catch (err) {
    next(err);
  }
});

/** Method to edit user's profile */
router.post('/profile',
validate(validation.editProfile),
demo.checkDemo,
async (req, res, next) => {
  try {
    /** Get req parameters */
    const userId = req.user._id;
    const name = req.body.name;
    const phone = req.body.phone;
    const photo = req.body.photo;
    /** Try to find user */
    let user = await db.findUserById(userId)
      .select('token email name phone photo plan stripeId');
    /** Mofidy user params */
    user.name = name;
    user.phone = phone;
    user.photo = photo;
    /** Save user */
    user = await user.save();
    /** Report change profile */
    reporter.reportEditProfile(user);
    /** Respond with modified user */
    res.send(user);
  } catch (err) {
    next(err);
  }
});

/** Export */
module.exports = router;
