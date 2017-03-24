/**
 * Module to send out ush notifications
 *
 * @module push
 * @license MIT
 */

/** Dependencies */
const apn = require('apn');
const path = require('path');

const provider = new apn.Provider({
  key: path.join(__dirname, '../certificates/production_BorodutchStudio.Controlio.pkey'),
  cert: path.join(__dirname, '../certificates/production_BorodutchStudio.Controlio.pem'),
  production: true,
});

/** Push notification methods */

function pushInvite(users, project, type) {
  let text;
  switch (type) {
    case 'client':
      text = `You has invited to "${project}" as a client.`;
      break;
    case 'manager':
      text = `You has invited to "${project}" as a manager.`;
      break;
    default:
      text = `You has invited to "${project}" as an owner.`;
      break;
  }
  sendNotification(text, users);
}

function pushNewMessageToClients(project) {
  const text = `New message in "${project.title}"!`;
  sendNotification(text, project.clients);
}

/**
 * Method to send push notification
 * @param {String} text Text to send
 * @param {[Mongo:User]]} users A list of users to receive the notification
 */
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
        console.info(`Sent '${text}' to ${response.sent.map(v => JSON.stringify(v))}`);
      }
      if (response.failed.length > 0) {
        console.info(`Failed sending to ${response.failed.map(fail => JSON.stringify(fail))}`);
      }
    })
    .catch(/** TODO: handle error */);
}

/** Exports */
module.exports = {
  sendNotification,
  pushInvite,
  pushNewMessageToClients,
};
