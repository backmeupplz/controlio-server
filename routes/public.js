/** Dependencies */
const express = require('express');
const dbmanager = require('../helpers/dbmanager');
const errors = require('../helpers/errors');
const hash = require('../helpers/hash');
const botReporter = require('../helpers/botReporter');

const router = express.Router();

/** Method to return reset password web page */
router.get('/resetPassword', (req, res) => {
  const userId = req.query.userid;
  const token = req.query.token;
  if (!token || !userId) {
    res.render('error', { error: 'No token or user id provided' });
    return;
  }
  dbmanager.getUserById(userId)
    .then((user) => {
      if (!user) {
        res.render('error', { error: errors.noUserFound().message });
      } else if (!user.tokenForPasswordResetIsFresh) {
        res.render('error', { error: 'You can only use reset link once.' });
      } else if (user.tokenForPasswordReset !== token) {
        res.render('error', { error: 'You can only use reset link once.' });
      } else {
        user.tokenForPasswordResetIsFresh = false;
        user.save()
          .then(() => {
            botReporter.reportGetResetPassword(user.email);
            res.render('reset-password', { userid: userId, token });
          })
          .catch(err => res.render('error', { error: err.message || 'Something went wrong :(' }));
      }
    })
    .catch(err => res.render('error', { error: err.message || 'Something went wrong :(' }));
});

/** Method to reset password */
router.post('/resetPassword', (req, res) => {
  const password = String(req.body.password);
  const userId = req.body.userid;
  const token = req.body.token;

  if (password.length < 6 || password.length > 30) {
    res.render('error', { error: 'Password length should be between 6 and 30 characters' });
    return;
  }

  dbmanager.getUserById(userId)
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
                botReporter.reportResetPassword(user.email);
                res.render('success', { message: 'Password was updated!' });
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
