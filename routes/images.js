/** Dependencies */
const express = require('express');
const auth = require('../helpers/auth');
const validate = require('express-validation');
const validation = require('../validation/files');
const errors = require('../helpers/errors');
const config = require('../config');
const multer = require('multer');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });
const bucket = require('../helpers/bucket').create({
  identy: config.identy,
  region: config.region,
  bucketName: config.bucketName,
});

const router = express.Router();

/** Private API check */
router.use(auth.checkToken);

router.get('/', validate(validation.download), function (req, res, next) {
  const key = req.query.key;
  bucket.download(key)
    .then((result) => {
      res.set({
        'x-timestamp': Date.now(),
        'x-sent': true,
        'Cache-Control': 'max-age=2592000',
        // 'Content-Type': 'arraybuffer',
      });
      res.send(result);
    })
    .catch((err) => {
      next(errors.bucketDownload());
    });
});

router.post('/', validate(validation.upload), upload.array('image', 10), function (req, res, next) {
  const key = req.body.key;
  const files = req.files;
  files.forEach(file => bucket.upload(key, file)
      .then(result => res.send(result))
      .catch((err) => {
        next(errors.bucketUpload());
      }));
});

/** Export */
module.exports = router;
