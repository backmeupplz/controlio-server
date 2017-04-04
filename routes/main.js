/** Dependencies */
const express = require('express');

const router = express.Router();
const validate = require('express-validation');
const validation = require('../validation/main');

/** A list of features to enable in iOS app */
router.get('/feature_list', (req, res) => {
  res.send({ 0: false, 1: false });
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
    ['DE:9A:EC:67:59:31:8F:79:89:F4:58:E7:20:87:80:68:FA:14:D0:61:25:05:D0:2E:BE:32:C1:4E:5D:61:99:59'],
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
  res.send(google);
});

/** Allows Android to use magic links */
router.get('/.well-known/assetlinks.json', (req, res) => {
  res.send(google);
});

/** Show magic link login page */
router.get('/magic', validate(validation.magic), (req, res) => {
  const token = req.query.token;
  res.render('magic', { token });
});

/** Export */
module.exports = router;
