/** Dependencies */
const express = require('express');
const db = require('../helpers/db');
const auth = require('../helpers/auth');
const validate = require('express-validation');
const validation = require('../validation/projects');
const errors = require('../helpers/errors');
const _ = require('lodash');
const validator = require('validator');
const demo = require('../helpers/demo');

const router = express.Router();

/** Private API check */
router.use(auth.checkToken);

/** Method to get a project by id */
router.get('/project',
validate(validation.getProject),
async (req, res, next) => {
  try {
    /** Get req params */
    const userId = req.user._id;
    const projectId = req.query.projectid;
    /** Get project */
    const project = await db.getProject(userId, projectId);
    /** Respond with project */
    res.send(project);
  } catch (err) {
    next(err);
  }
});

/** Method to get a list of the projects */
router.get('/',
validate(validation.getProjects),
async (req, res, next) => {
  try {
    /** Get req params */
    const userId = req.user._id;
    const skip = parseInt(req.query.skip || 0, 10);
    const limit = parseInt(req.query.limit || 20, 10);
    const type = req.query.type || 'all';
    const query = req.query.query || '';
    /** Get projects */
    const projects = await db.getProjects(userId, skip, limit, type, query);
    /** Respond with projects */
    res.send(projects);
  } catch (err) {
    next(err);
  }
});

/** Method to get invites to projects for user */
router.get('/invites',
async (req, res, next) => {
  try {
    /** Get req params */
    const userId = req.user._id;
    /** Get invites */
    const invites = await db.getInvites(userId);
    /** Respond with invites */
    res.send(invites);
  } catch (err) {
    next(err);
  }
});

/** Check if not demo */
router.use(demo.checkDemo);

/** Method to create a new project */
router.post('/',
validate(validation.post),
async (req, res, next) => {
  try {
    /** Get req params */
    const project = _.clone(req.body);
    project.progressEnabled = req.body.progressEnabled || false;
    project.userId = req.user._id;
    /** Approach different types of project creation */
    if (project.type === 'client') {
      /** Throw error if maanger email is invalid */
      if (!validator.isEmail(project.managerEmail)) {
        throw errors.validManagerEmail();
      }
      project.managerEmail = project.managerEmail.toLowerCase();
    } else if (project.type === 'manager') {
      /** Make client emails unique, lowercase and valid */
      project.clientEmails =
        _.uniq(req.body.clientEmails.map(email => email.toLowerCase()))
          .filter(email => validator.isEmail(email));
    }
    /** Create a project */
    const dbproject = await db.addProject(project);
    /** Respond with created project */
    res.send(dbproject);
  } catch (err) {
    next(err);
  }
});

/** Method to accept or reject invite */
router.post('/invite',
validate(validation.postInvite),
async (req, res, next) => {
  try {
    /** Get req params */
    const userId = req.user._id;
    const inviteId = req.body.inviteid;
    const accept = req.body.accept;
    /** Accept an invite */
    await db.acceptInvite(userId, inviteId, accept);
    /** Send success */
    res.send({ success: true });
  } catch (err) {
    next(err);
  }
});

/** Method to delete an invite */
router.delete('/invite',
validate(validation.deleteInvite),
async (req, res, next) => {
  try {
    /** Get req params */
    const userId = req.user._id;
    const inviteId = req.body.inviteid;
    /** Remove invite */
    await db.removeInvite(userId, inviteId);
    /** Send success */
    res.send({ success: true });
  } catch (err) {
    next(err);
  }
});

/** Method to add managers */
router.post('/managers',
validate(validation.postManagers),
async (req, res, next) => {
  try {
    /** Get req params */
    const userId = req.user._id;
    const projectId = req.body.projectid;
    /** Managers emails should be unique and lowercase */
    const managers = _.uniq(req.body.managers.map(email => email.toLowerCase()));
    /** Throw an error if user tries to add demo account as a manager */
    // TODO: create smarter check here, i.e. we have more than one demo account
    if (managers.includes('giraffe@controlio.co')) {
      throw errors.addDemoAsClient();
    }
    /** Add managers */
    await db.addManagers(userId, projectId, managers);
    /** Send success */
    res.send({ success: true });
  } catch (err) {
    next(err);
  }
});

/** Method to delete a manager */
router.delete('/manager',
validate(validation.deleteManager),
async (req, res, next) => {
  try {
    /** Get req params */
    const userId = req.user._id;
    const managerId = req.body.managerid;
    const projectId = req.body.projectid;
    /** Remove manager */
    await db.removeManager(userId, managerId, projectId);
    /** Send success */
    res.send({ success: true });
  } catch (err) {
    next(err);
  }
});

/** Method to delete a client */
router.delete('/client',
validate(validation.deleteClient),
async (req, res, next) => {
  try {
    /** Get req params */
    const userId = req.user._id;
    const clientId = req.body.clientid;
    const projectId = req.body.projectid;
    /** Remove client */
    await db.removeClient(userId, clientId, projectId);
    /** Send success */
    res.send({ success: true });
  } catch (err) {
    next(err);
  }
});

/** Method to add clients */
router.post('/clients',
validate(validation.postClients),
async (req, res, next) => {
  try {
    /** Get req params */
    const userId = req.user._id;
    const projectId = req.body.projectid;
    const clients = _.uniq(req.body.clients.map(email => email.toLowerCase()));
    /** Throw an error if user tries to add demo account as a client */
    // TODO: create smarter check here, i.e. we have more than one demo account
    if (clients.includes('giraffe@controlio.co')) {
      throw errors.addDemoAsClient();
    }
    /** Add clients */
    await db.addClients(userId, projectId, clients);
    /** Send success */
    res.send({ success: true });
  } catch (err) {
    next(err);
  }
});

/** Method to edit project */
router.put('/',
validate(validation.put),
async (req, res, next) => {
  try {
    /** Get req params */
    const userId = req.user._id;
    const projectId = req.body.projectid;
    const title = req.body.title;
    const description = req.body.description;
    const image = req.body.image;
    const progressEnabled = req.body.progressEnabled || false;
    /** Edit project */
    const project =
      await db.editProject(userId, projectId, title, description, image, progressEnabled);
    /** Respond with resulting project */
    res.send(project);
  } catch (err) {
    next(err);
  }
});

/** Method to edit progress */
router.put('/progress',
validate(validation.putProgress),
async (req, res, next) => {
  try {
    /** Get req params */
    const userId = req.user._id;
    const projectId = req.body.projectid;
    const progress = req.body.progress;
    /** Edit progress */
    await db.editProgress(userId, projectId, progress);
    /** Respond with success */
    res.send({ success: true });
  } catch (err) {
    next(err);
  }
});

/** Method to leave project */
router.post('/leave',
validate(validation.leave),
async (req, res, next) => {
  try {
    /** Get req params */
    const userId = req.user._id;
    const projectId = req.body.projectid;
    /** Leave project */
    await db.leaveProject(userId, projectId);
    /** Respond with success */
    res.send({ success: true });
  } catch (err) {
    next(err);
  }
});

/** Method to delete project */
router.delete('/',
validate(validation.delete),
async (req, res, next) => {
  try {
    /** Get req params */
    const userId = req.user._id;
    const projectId = req.body.projectid;
    /** Delete project */
    db.deleteProject(userId, projectId);
    /** Respond with success */
    res.send({ success: true });
  } catch (err) {
    next(err);
  }
});


/** Method to finish the project */
router.post('/finish',
validate(validation.finish),
async (req, res, next) => {
  try {
    /** Get req params */
    const userId = req.user._id;
    const projectId = req.body.projectid;
    /** Finish project */
    const project = await db.finishProject(userId, projectId, true);
    /** Respond with resulting project */
    res.send(project);
  } catch (err) {
    next(err);
  }
});

/** Method to revive the project */
router.post('/revive',
validate(validation.finish),
async (req, res, next) => {
  try {
    /** Get req params */
    const userId = req.user._id;
    const projectId = req.body.projectid;
    /** Finish project */
    const project = await db.finishProject(userId, projectId, false);
    /** Respond with project */
    res.send(project);
  } catch (err) {
    next(err);
  }
});

/** Export */
module.exports = router;
