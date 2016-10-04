const express = require('express');

const router = express.Router();

router.get('/resetPassword', (req, res, next) => {
  res.render('reset-password');
});

// DEBUG
const hogan = require('hogan.js');
const path = require('path');
const fs = require('fs');
const emailRawHtml = fs.readFileSync(path.join(__dirname, '../views/email-magic-link.hjs'), 'utf8');
const emailTemplate = hogan.compile(emailRawHtml);
router.get('/preview', (req, res) => {
  res.send(emailTemplate.render({ name: 'nikita' }));
});

// Export

module.exports = router;
