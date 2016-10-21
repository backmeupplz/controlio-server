const express = require('express');

const router = express.Router();

router.get('/feature_list', (req, res) => {
  res.send({ 0: true });
});

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

router.get('/magic', (req, res) => {
  const userid = req.query.userid;
  const token = req.query.token;
  res.render('magic', { userid, token });
});

// Export

module.exports = router;
