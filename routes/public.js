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
router.get('/resetPassword', validate(validation.getResetPassword), (req, res) => {
  const token = req.query.token;

  const { error, data } = jwt.verify(token);
  if (error) {
    return res.render('error', { error: error.message || 'Something went wrong :(' });
  }
  if (!data || !data.userid) {
    return res.render('error', { error: 'Something went wrong :(' });
  }
  const userId = data.userid;
  db.findUserById(userId)
    .select('tokenForPasswordResetIsFresh tokenForPasswordReset email')
    .then((user) => {
      if (!user) {
        res.render('error', { error: errors.noUserFound().message });
      } else if (!user.tokenForPasswordResetIsFresh) {
        res.render('error', { error: 'You can only use reset link once.' });
      } else if (user.tokenForPasswordReset !== token) {
        res.render('error', { error: 'Not authorized (mismatched tokens).' });
      } else {
        user.tokenForPasswordResetIsFresh = false;
        user.save()
          .then(() => {
            reporter.reportGetResetPassword(user);
            res.render('reset-password', { token });
          })
          .catch(err => res.render('error', { error: err.message || 'Something went wrong :(' }));
      }
    })
    .catch(err => res.render('error', { error: err.message || 'Something went wrong :(' }));
});

/** Method to reset password */
router.post('/resetPassword', validate(validation.postResetPassword), (req, res) => {
  const password = req.body.password;
  const token = req.body.token;

  if (password.length < 6 || password.length > 30) {
    res.render('error', { error: 'Password length should be between 6 and 30 characters' });
    return;
  }

  const { error, data } = jwt.verify(token);
  if (error) {
    return res.render('error', { error: error.message || 'Something went wrong :(' });
  }
  if (!data || !data.userid) {
    return res.render('error', { error: 'Something went wrong :(' });
  }
  const userId = data.userid;

  db.findUserById(userId)
    .select('tokenForPasswordResetIsFresh tokenForPasswordReset email')
      .then((user) => {
        if (!user) {
          res.render('error', { error: errors.noUserFound().message });
        } else if (user.tokenForPasswordReset !== token) {
          res.render('error', { error: 'Wrong token provided.' });
        } else {
          hash.hashPassword(password)
            .then((result) => {
              user.tokenForPasswordReset = null;
              user.password = result;
              user.save()
                .then(() => {
                  reporter.reportResetPassword(user);
                  res.render('success', { message: 'Password was updated!' });
                })
                .catch(err => res.render('error', { error: err.message || 'Something went wrong :(' }));
            })
            .catch(err => res.render('error', { error: err.message || 'Something went wrong :(' }));
        }
      })
      .catch(err => res.render('error', { error: err.message || 'Something went wrong :(' }));
});

/** Method to return set password web page */
router.get('/setPassword', validate(validation.getSetPassword), (req, res) => {
  const token = req.query.token;

  const { error, data } = jwt.verify(token);
  if (error) {
    return res.render('error', { error: error.message || 'Something went wrong :(' });
  }
  if (!data || !data.userid) {
    return res.render('error', { error: 'Something went wrong :(' });
  }
  const userId = data.userid;

  db.findUserById(userId)
    .select('tokenForPasswordResetIsFresh tokenForPasswordReset email')
    .then((user) => {
      if (!user) {
        res.render('error', { error: errors.noUserFound().message });
      } else if (!user.tokenForPasswordResetIsFresh) {
        res.render('error', { error: 'You can only use set password link once.' });
      } else if (user.tokenForPasswordReset !== token) {
        res.render('error', { error: 'Not authorized (mismatched tokens).' });
      } else {
        user.tokenForPasswordResetIsFresh = false;
        user.save()
          .then(() => {
            reporter.reportGetSetPassword(user);
            res.render('set-password', { token });
          })
          .catch(err => res.render('error', { error: err.message || 'Something went wrong :(' }));
      }
    })
    .catch(err => res.render('error', { error: err.message || 'Something went wrong :(' }));
});

/** Method to set password */
router.post('/setPassword', validate(validation.postSetPassword), (req, res) => {
  const password = String(req.body.password);
  const token = req.body.token;

  if (password.length < 6 || password.length > 30) {
    res.render('error', { error: 'Password length should be between 6 and 30 characters' });
    return;
  }
  const { error, data } = jwt.verify(token);
  if (error) {
    return res.render('error', { error: error.message || 'Something went wrong :(' });
  }
  if (!data || !data.userid) {
    return res.render('error', { error: 'Something went wrong :(' });
  }
  const userId = data.userid;

  db.findUserById(userId)
    .select('tokenForPasswordResetIsFresh tokenForPasswordReset email')
      .then((user) => {
        if (!user) {
          res.render('error', { error: errors.noUserFound().message });
        } else if (user.tokenForPasswordReset !== token) {
          res.render('error', { error: 'Wrong token provided.' });
        } else if (user.password) {
          res.sender('error', { error: errors.passwordAlreadyExist().message });
        } else {
          hash.hashPassword(password)
            .then((result) => {
              user.tokenForPasswordReset = null;
              user.password = result;
              user.save()
                .then(() => {
                  reporter.reportSetPassword(user);
                  res.render('success', { message: 'Password has been set!' });
                })
                .catch(err => res.render('error', { error: err.message || 'Something went wrong :(' }));
            })
            .catch(err => res.render('error', { error: err.message || 'Something went wrong :(' }));
        }
      })
      .catch(err => res.render('error', { error: err.message || 'Something went wrong :(' }));
});

/** Export */
module.exports = router;
