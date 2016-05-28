var express = require('express');
var router = express.Router();
var dbmanager = rootRequire('helpers/dbmanager');
var hash = rootRequire('helpers/hash');
var jwt = require('jsonwebtoken');
var config = rootRequire('config');
var errors = rootRequire('helpers/errors');

// Public API

router.post('/login', function(req, res) {
  var email = req.body.email;
  var rawPassword = req.body.password;

  var getUserCallback = function(err, user) {
    if (err) {
      res.send(err);
    } else if (user) {
      if (hash.checkPassword(user.password, rawPassword)) {
        user.password = undefined;
        res.send(user);
      } else {
        res.send(errors.authWrongPassword());
      }
    } else {
      res.send(errors.authEmailNotRegistered());
    }
  };
  
  if (!email) {
    res.send(errors.authNoEmail());
  } else if (!rawPassword) {
    res.send(errors.authNoPassword());
  } else {
    dbmanager.getUser({email: email}, getUserCallback, '+password +token');
  }
});

router.post('/', function(req, res) {
  var email = req.body.email;
  var rawPassword = req.body.password;

  var addUserCallback = function(err, user) {
    if (err) {
      res.send(err);
    } else {
      user.password = undefined;
      res.send(user);
    }
  };

  if (!email) {
    res.send(errors.authNoEmail());
  } else if (!rawPassword) {
    res.send(errors.authNoPassword());
  } else {
    var hashPass = hash.hashPassword(rawPassword);

    if (hashPass) {
      var user = {
        email: email,
        password: hashPass,
        token: jwt.sign(email, config.jwtSecret)
      };

      dbmanager.addUser(user, addUserCallback);
    } else {
      res.send(errors.authHashError());
    }
  }
});

// Private API

router.use(function(req, res, next) {
  var token = req.get('x-access-token');
  var email = req.body.email;

  var getUserCallback = function(err, user, token) {
    if (err) {
      res.send(err);
    } else if (user) {
      if (user.token == token) {
        next();
      } else {
        res.send(errors.tokenFailed());
      }
    } else {
      res.send(errors.authEmailNotRegistered());
    }
  };

  if (!email) {
    res.send(errors.authNoEmail());
  } else if (!token) {
    res.send(errors.noTokenProvided());
  } else {
    jwt.verify(token, config.jwtSecret, function(err) {
      if (err) {
        res.send(errors.tokenFailed());
      } else {
        dbmanager.getUser({email: email}, function(err, user) {
          getUserCallback(err, user, token);
        }, '+token');
      }
    });
  }
});

router.post('/getusers', function(req, res, next) {
  dbmanager.getUsers(function(err, users) {
    if (err) {
      next(err);
    } else {
      res.send(users);
    }
  });
});

// DEBUG

router.get('/removeallusers', function(req, res, next) {
  dbmanager.debug.removeAllUsers(function(err) {
    if (err) {
      next(err);
    } else {
      res.sendStatus(200);
    }
  });
});

// Export

module.exports = router;