const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const db = require('../helpers/db');
const jwt = require('jsonwebtoken');
const config = require('../config');

function closeConnectDrop() {
  return new Promise((resolve, reject) => {
    mongoose.connection.close((err) => {
      if (err) return reject(err);
      mongoose.connect('mongodb://localhost:27017/controlio-test', (error) => {
        if (error) return reject(error);
        mongoose.connection.db.dropDatabase((inerr) => {
          if (inerr) return reject(inerr);
          resolve();
        });
      });
    });
  });
}

function dropClose() {
  return new Promise((resolve, reject) => {
    mongoose.connection.db.dropDatabase((err) => {
      if (err) return reject(err);
      mongoose.connection.close((inerr) => {
        if (inerr) return reject(inerr);
        resolve();
      });
    });
  });
}

function addUserWithJWT(user) {
  return db.addUser(user)
    .then((dbuser) => {
      dbuser.token = jwt.sign({
        email: dbuser.email,
        userid: dbuser._id,
      }, config.jwtSecret);
      return dbuser.save();
    });
}

module.exports = {
  closeConnectDrop,
  dropClose,
  addUserWithJWT,
};
