const express = require('express');

const router = express.Router();

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
  res.render('magic');
});

// Export

module.exports = router;
