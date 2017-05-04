/** Dependencies */
const express = require('express');

const router = express.Router();
const validate = require('express-validation');
const validation = require('../validation/main');
const errors = require('../helpers/errors');

/** A list of errors */
router.get('/error_list', (req, res) => {
  res.send(errors.localizedList);
});

/** A list of features to enable in iOS app */
router.get('/feature_list', (req, res) => {
  res.send({ 0: false, 1: true });
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

const google = [{
  relation: ['delegate_permission/common.handle_all_urls'],
  target: {
    namespace: 'android_app',
    package_name: 'ru.adonixis.controlio',
    sha256_cert_fingerprints:
    ['07:26:B2:FD:BD:DC:5F:C2:0A:28:E4:EB:82:B9:B9:49:3B:63:27:FC:40:4F:32:E0:83:A6:F9:B1:47:90:32:36'],
  },
}];

/** Allows iOS to use magic links */
router.get('/.well-known/apple-app-site-association', (req, res) => {
  res.send(apple);
});

/** Allows iOS to use magic links */
router.get('/apple-app-site-association', (req, res) => {
  res.send(apple);
});

/** Allows Android to use magic links */
router.get('/assetlinks.json', (req, res) => {
  res.set('Content-Type', 'application/json');
  res.status(200);
  res.send(google);
});

/** Allows Android to use magic links */
router.get('/.well-known/assetlinks.json', (req, res) => {
  res.set('Content-Type', 'application/json');
  res.status(200);
  res.send(google);
});

/** Show magic link login page */
router.get('/magic', validate(validation.magic), (req, res) => {
  const token = req.query.token;
  res.render('magic', { token });
});

/** Export */
module.exports = router;
