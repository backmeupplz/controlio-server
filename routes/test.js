/** Dependencies */
const express = require('express');

const router = express.Router();

// const path.join(__dirname, 'templates', 'pasta-dinner')

/** Method to test email */
router.get('/email', (req, res) => {
  res.render('templates/magic-link/html', {
    button_title: 'Lorem ipsum',
    button_url: 'https://google.ca',
    texts: [
      'Lorem ipsum dolor sit amet, ne quas similique vel, vocent dolorem pro ne. Ex odio vocibus percipit mea. Te pro malis eligendi conceptam, qui an omnes pertinacia, mundi quodsi cu qui. Vel an habemus reprehendunt. Duo at maluisset consequat, et est tale nostrud legendos. Ullum posidonium vel ex, est ad dolorum inermis deterruisset.',
      'His reformidans contentiones cu, te oporteat prodesset adversarium sea. Exerci mediocrem prodesset nec ei. Vis libris corpora an, ne est noster evertitur. Vim quem deleniti fabellas an.',
    ],
  });
});

/** Export */
module.exports = router;
