/** Dependencies */
const express = require('express');

const router = express.Router();

/** A list of features to enable in iOS app */
router.get('/feature_list', (req, res) => {
  res.send({ 0: true, whatever: 'iwant' });
});

/** Allows iOS to use magic links */
router.get('/.well-known/apple-app-site-association', (req, res) => {
  res.send({
    applinks: {
      apps: [],
      details: [
        {
          appID: '9VUB6L23QH.BorodutchStudio.Controlio',
          paths: ['/magic'],
        },
      ],
    },
  });
});

/** Allows iOS to use magic links */
router.get('/apple-app-site-association', (req, res) => {
  res.send({
    applinks: {
      apps: [],
      details: [
        {
          appID: '9VUB6L23QH.BorodutchStudio.Controlio',
          paths: ['/magic'],
        },
      ],
    },
  });
});

/** Show magic link login pagem */
router.get('/magic', (req, res) => {
  const userid = req.query.userid;
  const token = req.query.token;
  res.render('magic', { userid, token });
});

/** Export */
module.exports = router;
