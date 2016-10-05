const express = require('express');

const router = express.Router();

router.get('/apple-app-site-association', (req, res) => {
  res.send({
    applinks: {
      apps: [],
      details: [
        {
          appID: 'TBEJCS6FFP.com.domain.App',
          paths: ['*'],
        },
      ],
    },
  });
});

// Export

module.exports = router;
