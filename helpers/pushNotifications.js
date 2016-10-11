const apn = require('apn');
const path = require('path');

const provider = new apn.Provider({
  key: path.join(__dirname, '../certificates/key.pem'),
  cert: path.join(__dirname, '../certificates/production_BorodutchStudio.Controlio.pem'),
  production: true,
});

function sendNotification(text, users) {
  const notification = new apn.Notification();
  notification.alert = text;
  notification.topic = 'BorodutchStudio.Controlio';
  let resultTokens = [];
  users.forEach((user) => {
    resultTokens = resultTokens.concat(user.iosPushTokens);
  });
  provider.send(notification, resultTokens)
    .then((response) => {
      if (response.sent.length > 0) {
        console.log(`Sent '${text}' to ${response.sent.map(v => JSON.stringify(v))}`);
      }
      if (response.failed.length > 0) {
        console.log(`Failed sending to ${response.failed.map(fail => JSON.stringify(fail))}`);
      }
    })
    .catch(err => console.log(err));
}

module.exports = {
  sendNotification,
};
