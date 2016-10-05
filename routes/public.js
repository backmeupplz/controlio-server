const express = require('express');
const dbmanager = require('../helpers/dbmanager');
const errors = require('../helpers/errors');
const hash = require('../helpers/hash');

const router = express.Router();

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
      } else {
        if (!user.tokenForPasswordResetIsFresh) {
          res.render('error', { error: 'You can only use reset link once.' });
        } else {
          if (user.tokenForPasswordReset !== token) {
            res.render('error', { error: 'You can only use reset link once.' });
          } else {
            user.tokenForPasswordResetIsFresh = false;
            user.save()
              .then(() => res.render('reset-password', { userid: userId, token: token }))
              .catch(err => res.render('error', { error: err.message || 'Something went wrong :(' }));
          }
        }
      }
    })
    .catch(err => res.render('error', { error: err.message || 'Something went wrong :(' }));
});

router.post('/resetPassword', (req, res) => {
  const password = req.body.password;
  const userId = req.body.userid;
  const token = req.body.token;

  dbmanager.getUserById(userId)
    .then((user) => {
      if (!user) {
        res.render('error', { error: errors.noUserFound().message });
      } else {
        if (user.tokenForPasswordReset !== token) {
          res.render('error', { error: 'Wrong token provided.' });
        } else {
          hash.hashPassword(password)
            .then((result) => {
              user.tokenForPasswordReset = null;
              user.password = result;
              user.save()
                .then(() => {
                  res.render('success', { message: 'Password was updated!' });
                })
                .catch(err => res.render('error', { error: err.message || 'Something went wrong :(' }));
            })
            .catch(err => res.render('error', { error: err.message || 'Something went wrong :(' }));
        }
      }
    })
    .catch(err => res.render('error', { error: err.message || 'Something went wrong :(' }));
});

// DEBUG
const hogan = require('hogan.js');
const path = require('path');
const fs = require('fs');
const emailRawHtml = fs.readFileSync(path.join(__dirname, '../views/email-reset.hjs'), 'utf8');
const emailTemplate = hogan.compile(emailRawHtml, { userid: '12', token: '11' });
router.get('/preview', (req, res) => {
  res.send(emailTemplate.render({ name: 'nikita' }));
});

// Export

module.exports = router;
