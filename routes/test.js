/** Dependencies */
const path = require('path');
const EmailTemplate = require('email-templates').EmailTemplate;
const juice = require('juice');

const express = require('express');

const router = express.Router();

/** Method to test email */
router.get('/email', (req, res, next) => {
  const templateDir = path.join(__dirname, '..', 'views', 'templates', 'email');
  const emailTemplate = new EmailTemplate(templateDir);

  const data = {
    title: 'Lorem the ipsum',
    texts: [
      'Lorem ipsum dolor sit amet, ne quas similique vel, vocent dolorem pro ne. Ex odio vocibus percipit mea. Te pro malis eligendi conceptam, qui an omnes pertinacia, mundi quodsi cu qui. Vel an habemus reprehendunt. Duo at maluisset consequat, et est tale nostrud legendos. Ullum posidonium vel ex, est ad dolorum inermis deterruisset.',
      'His reformidans contentiones cu, te oporteat prodesset adversarium sea. Exerci mediocrem prodesset nec ei. Vis libris corpora an, ne est noster evertitur. Vim quem deleniti fabellas an.',
    ],
    needsLinks: true,
  };

  emailTemplate.render(data, (err, result) => {
    if (err) return next(err);

    juice.juiceResources(result.html, {
      webResources: {
        images: 0,
        svgs: 0,
      },
    }, (error, html) => {
      if (error) return next(error);
      res.send(html);
    });
  });
});

/** Export */
module.exports = router;
