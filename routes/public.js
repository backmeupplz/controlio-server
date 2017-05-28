/** Dependencies */
const express = require('express');
const db = require('../helpers/db');
const errors = require('../helpers/errors');
const hash = require('../helpers/hash');
const reporter = require('../helpers/reporter');
const validate = require('express-validation');
const validation = require('../validation/public');
const jwt = require('../helpers/jwt');

const router = express.Router();

/** Method to return reset password web page */
router.get('/resetPassword',
validate(validation.getResetPassword),
async (req, res) => {
  try {
    /** Get req parameters */
    const token = req.query.token;
    /** Verify reset password token */
    const { error, data } = jwt.verify(token);
    /** Throw an error if cannot verify password token */
    if (error) {
      throw error;
    }
    /** Throw an error if no data in reset password token */
    if (!data || !data.userid) {
      throw new Error();
    }
    /** Get user id from reset password token */
    const userId = data.userid;
    /** Get user from db */
    let user = await db.findUserById(userId)
      .select('tokenForPasswordResetIsFresh tokenForPasswordReset email');
    /** Throw error if no user found */
    if (!user) {
      throw errors.noUserFound();
    }
    /** Throw error if reset password token isn't fresh */
    if (!user.tokenForPasswordResetIsFresh) {
      throw new Error('You can only use reset link once.');
    }
    /** Throw error if reset password tokens don't match */
    if (user.tokenForPasswordReset !== token) {
      throw new Error('Not authorized (mismatched tokens).');
    }
    /** Save user with password token spoiled */
    user.tokenForPasswordResetIsFresh = false;
    user = await user.save();
    /** Report view of reset password page */
    reporter.reportGetResetPassword(user);
    /** Render reset password page */
    res.render('reset-password', { token });
  } catch (err) {
    /** Render error */
    res.render('error', { error: err.message || 'Something went wrong :(' });
  }
});

/** Method to reset password */
router.post('/resetPassword',
validate(validation.postResetPassword),
async (req, res) => {
  try {
    /** Get req parameters */
    const password = req.body.password;
    const token = req.body.token;
    /** Throw error if password length is wrong */
    if (password.length < 6 || password.length > 30) {
      throw new Error('Password length should be between 6 and 30 characters');
    }
    /** Try to verify reset password token */
    const { error, data } = jwt.verify(token);
    /** Throw error if password reset token is invalid */
    if (error) {
      throw error;
    }
    /** Throw an error if no data in reset password token */
    if (!data || !data.userid) {
      throw new Error();
    }
    /** Get user id from reset password token */
    const userId = data.userid;
    /** Get user from db */
    let user = await db.findUserById(userId)
      .select('tokenForPasswordResetIsFresh tokenForPasswordReset email');
    /** Throw error if no user found */
    if (!user) {
      throw errors.noUserFound();
    }
    /** Throw error if reset password tokens don't match */
    if (user.tokenForPasswordReset !== token) {
      throw new Error('Wrong token provided.');
    }
    /** Hash new password */
    const hashedPassword = await hash.hashPassword(password);
    /** Save new password */
    user.tokenForPasswordReset = null;
    user.password = hashedPassword;
    user = await user.save();
    /** Report password reset */
    reporter.reportResetPassword(user);
    /** Render success page */
    res.render('success', { message: 'Password was updated!' });
  } catch (err) {
    /** Render error */
    res.render('error', { error: err.message || 'Something went wrong :(' });
  }
});

/** Method to return set password web page */
router.get('/setPassword',
validate(validation.getSetPassword),
async (req, res) => {
  try {
    /** Get req parameters */
    const token = req.query.token;
    /** Try to verify set password token */
    const { error, data } = jwt.verify(token);
    /** Throw error if set password token is invalid */
    if (error) {
      throw error;
    }
    /** Throw error if no data can be fetched from set password token */
    if (!data || !data.userid) {
      throw new Error();
    }
    /** Get user id from reset password token */
    const userId = data.userid;
    /** Get user from db */
    let user = await db.findUserById(userId)
      .select('tokenForPasswordResetIsFresh tokenForPasswordReset email');
    /** Throw error if no user found */
    if (!user) {
      throw errors.noUserFound();
    }
    /** Throw error if set password token is spoiled */
    if (!user.tokenForPasswordResetIsFresh) {
      throw new Error('You can only use set password link once.');
    }
    /** Throw error if set password tokens don't match */
    if (user.tokenForPasswordReset !== token) {
      throw new Error('Not authorized (mismatched tokens).');
    }
    /** Save user and spoil token */
    user.tokenForPasswordResetIsFresh = false;
    user = await user.save();
    /** Report set token page view */
    reporter.reportGetSetPassword(user);
    /** Render set password page */
    res.render('set-password', { token });
  } catch (err) {
    /** Render error */
    res.render('error', { error: err.message || 'Something went wrong :(' });
  }
});

/** Method to set password */
router.post('/setPassword',
validate(validation.postSetPassword),
async (req, res) => {
  try {
    /** Get req parameters */
    const password = req.body.password;
    const token = req.body.token;
    /** Throw error if password length is wrong */
    if (password.length < 6 || password.length > 30) {
      throw new Error('Password length should be between 6 and 30 characters');
    }
    /** Try to verify reset password token */
    const { error, data } = jwt.verify(token);
    /** Throw error if password reset token is invalid */
    if (error) {
      throw error;
    }
    /** Throw an error if no data in reset password token */
    if (!data || !data.userid) {
      throw new Error();
    }
    /** Get user id from reset password token */
    const userId = data.userid;
    /** Get user from db */
    let user = await db.findUserById(userId)
      .select('tokenForPasswordResetIsFresh tokenForPasswordReset email');
    /** Throw error if no user found */
    if (!user) {
      throw errors.noUserFound();
    }
    /** Throw error if reset password tokens don't match */
    if (user.tokenForPasswordReset !== token) {
      throw new Error('Wrong token provided.');
    }
    /** Hash new password */
    const hashedPassword = await hash.hashPassword(password);
    /** Save new password */
    user.tokenForPasswordReset = null;
    user.password = hashedPassword;
    user = await user.save();
    /** Report password reset */
    reporter.reportSetPassword(user);
    /** Render success page */
    res.render('success', { message: 'Password has been set!' });
  } catch (err) {
    res.render('error', { error: err.message || 'Something went wrong :(' });
  }
});

/** Export */
module.exports = router;
