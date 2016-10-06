const apn = require('apn');
const path = require('path');
// const dbmanager = require('./dbmanager');

const provider = new apn.Provider({
  key: path.join(__dirname, '../certificates/production_BorodutchStudio.Controlio.pkey'),
  cert: path.join(__dirname, '../certificates/production_BorodutchStudio.Controlio.pem'),
  production: false,
});

// const options = {
//   batchFeedback: true,
//   interval: 300,
// };

// const feedback = new apn.Feedback(options);
// feedback.on('feedback', dbmanager.removeTokens);

function sendNotification(text, users) {
  const notification = new apn.Notification();
  notification.alert = text;
  let resultTokens = [];
  users.forEach((user) => {
    resultTokens = resultTokens.concat(user.iosPushTokens);
  });
  provider.send(notification, resultTokens)
    .then((response) => {
      if (response.sent.length > 0) {
        console.log(`Sent '${text}' to ${response.sent}`);
      }
      if (response.failed.length > 0) {
        console.log(`Failed sending '${text}' to ${response.sent}`);
      }
    })
    .catch(err => console.log(err));
}

module.exports = {
  sendNotification,
};
