const express = require('express');

const router = express.Router();

router.get('/apple-app-site-association', (req, res) => {
  res.send({
    applinks: {
      apps: [],
      details: [
        {
          appID: '9VUB6L23QH.BorodutchStudio.Controlio',
          paths: ['*'],
        },
      ],
    },
  });
});

// Export

module.exports = router;
