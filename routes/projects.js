var express = require('express');
var router = express.Router();
var dbmanager = rootRequire('helpers/dbmanager');
var auth = rootRequire('helpers/auth');
var errors = rootRequire('helpers/errors');

// Private API

router.use(auth.checkToken);

router.post('/', function(req, res, next) {
  // Check fields

  var userId = req.get('x-access-user-id');

  var title = req.body.title;
  var image = req.body.image;
  var status = req.body.status;
  var description = req.body.description;
  var manager = req.body.manager;
  var clients = req.body.clients;

  var requiredFields = [title, image, status, description, manager, clients];

  for (var i in requiredFields) {
    if (!requiredFields[i]) {
      next(new Error(500));
      return;
    }
  }

  // Add project

  var addProjectCallback = function(err, project) {
    if (err) {
      next(err);
    } else {
      res.sendStatus(200);
    }
  };

  var getClientsCallback = function(err, clientObjects, managerObject, ownerObject) {
    console.log(err);
    console.log(clientObjects);
    console.log(managerObject);
    console.log(ownerObject);

    var clientIds = [];
    for (var i in clientObjects) {
      var clientObject = clientObjects[i];
      clientIds.push(clientObject._id);
    }

    if (err) {
      next(err);
    } else if (clientObjects) {
      var project = {
        title: title,
        image: image,
        status: status,
        description: description,
        owner: ownerObject._id,
        manager: managerObject._id,
        clients: clientIds
      };

      dbmanager.addProject(project, addProjectCallback);
    } else {
      next(new Error(500));
    }
  };

  var getManagerCallback = function(err, managerObject, ownerObject) {
    if (err) {
      next(err);
    } else if (managerObject) {
      dbmanager.getClients(clients, function(err, clientObjects) {
        getClientsCallback(err, clientObjects, managerObject, ownerObject);
      });
    } else {
      dbmanager.addUserByEmail(manager, function(err, newManagerObject) {
        dbmanager.getClients(clients, function(err, clientObjects) {
          getClientsCallback(err, clientObjects, newManagerObject, ownerObject);
        });
      });
    }
  };

  var getOwnerCallback = function(err, ownerObject) {
    if (err) {
      next(err);
    } else if (ownerObject) {
      dbmanager.getUser({email: manager}, function(err, managerObject) {
        getManagerCallback(err, managerObject, ownerObject);
      });
    } else {
      next(new Error(500));
    }
  };

  dbmanager.getUser({_id: userId}, getOwnerCallback);
});

router.post('/getprojects', function(req, res, next) {
  var userId = req.get('x-access-user-id');
  var skip = req.body.skip || 0;
  var limit = req.body.limit || 20;
  dbmanager.getProjects(userId, skip, limit, function(err, projects) {
    if (err) {
      next(err);
    } else {
      res.send(projects);
    }
  });
});

// DEBUG

router.get('/removeallprojects', function(req, res, next) {
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