/** Dependencies */
const express = require('express');

const router = express.Router();
const validate = require('express-validation');
const validation = require('../validation/main');

/** A list of features to enable in iOS app */
router.get('/feature_list', (req, res) => {
  res.send({ 0: true, whatever: 'iwant' });
});

const apple = {
  applinks: {
    apps: [],
    details: [
      {
        appID: '9VUB6L23QH.BorodutchStudio.Controlio',
        paths: ['/magic', '/public/resetPassword', '/public/setPassword'],
      },
    ],
  },
};

/** Allows iOS to use magic links */
router.get('/.well-known/apple-app-site-association', (req, res) => {
  res.send(apple);
});

/** Allows iOS to use magic links */
router.get('/apple-app-site-association', (req, res) => {
  res.send(apple);
});

/** Show magic link login page */
router.get('/magic', validate(validation.magic), (req, res) => {
  const token = req.query.token;
  res.render('magic', { token });
});

/** Export */
module.exports = router;
