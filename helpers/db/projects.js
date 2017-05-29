/**
 * Manages all db requests for projects
 */

const { Project, Post, Invite } = require('../../models');
const users = require('./users');
const errors = require('../errors');
const demoAccounts = require('../demo').demoAccounts;
const reporter = require('../reporter');

/**
 * Function to add a project to the db
 * @param {Object} project Json of the project to add to the db
 * @return {Mongoose:Project} Project that should be created
 */
async function addProject(project) {
  const user = await users.findUserById(project.userId);
  /** If project is added as a client, create as a client */
  if (project.type === 'client') {
    return await addProjectAsClient(project, user);
  }
  /** If project is created as a manager, create as manager */
  return await addProjectAsManager(project, user);
}

/**
 * Function to add a project as client to the db
 * @param {Object} project Json of the project to add to the db
 * @param {Mongoose:User} user User that adds this project
 * @throws {ADD_SELF_AS_MANAGER_ERROR} If User tries to add itself as a manager
 * @throws {ADD_DEMO_AS_MANAGER_ERROR} If User tries to add demo account as a manager
 * @return {Mongoose:Project} Project that should be created
 */
async function addProjectAsClient(project, user) {
  /** Throw error if tries to add self as a manager */
  if (user.email === project.managerEmail) {
    throw errors.addSelfAsManager();
  }
  let manager = await users.findOrCreateUserWithEmail(project.managerEmail);
  /** Check if tries to add demo account */
  if (manager.isDemo) {
    throw errors.addDemoAsManager();
  }
  /** Add creator as a client */
  project.clients = [user];
  /** Add initial status */
  project = await addInitialStatus(project, user);
  /** Save project to db */
  let dbproject = new Project(project);
  dbproject = await dbproject.save();
  /** Add project to client */
  user.projects.push(dbproject);
  user = await user.save();
  /** Create invite */
  let invite = new Invite({
    type: 'own',
    sender: user._id,
    project: dbproject._id,
    invitee: manager._id,
  });
  /** Save invite */
  invite = await invite.save();
  /** Add invite to project */
  dbproject.invites.push(invite._id);
  dbproject = await dbproject.save();
  /** Add invite to maanger */
  manager.invites.push(invite._id);
  manager = await manager.save();
  /** Notify manager about the invite */
  manager.sendInvite(dbproject, 'owner');
  /** Return resulting project */
  return dbproject;
}

/**
 * Function to add a project as manager to the db
 * @param {Object} project Json of the project to add to the db
 * @param {Mongoose:User} user User that adds this project
 * @throws {ADD_SELF_AS_CLIENT_ERROR} If user is amongst the client emails
 * @throws {ADD_DEMO_AS_CLIENT_ERROR} If demo user is amongst the client emails
 * @return {Mongoose:Project} Promise with the Project that should be created
 */
async function addProjectAsManager(project, user) {
  /** Check if user isn't within the clients */
  if (project.clientEmails.includes(user.email)) {
    throw errors.addSelfAsClient();
  }
  /** Check if demo isn't within the clients */
  // TODO: add smarter demo account detection
  project.clientEmails.forEach((email) => {
    if (demoAccounts.includes(email)) {
      throw errors.addDemoAsClient();
    }
  });
  /** Check if enough projects on plan */
  await checkPlan(user);
  /** Get client objects */
  const clients = [];
  project.clientEmails.forEach(async (email) => {
    const client = await users.findOrCreateUserWithEmail(email);
    clients.push(client);
  });
  /** Add owner to project */
  project.owner = user;
  /** Add initial status */
  await addInitialStatus(project, user);
  /** Save project to database */
  let dbproject = new Project(project);
  dbproject = await dbproject.save();
  /** Add project to owner */
  user.projects.push(dbproject);
  user = await user.save();
  /** Add invites to clients */
  const invites = [];
  /** Loop through clients */
  clients.forEach(async (client) => {
    /** Send invite to client */
    client.sendInvite(dbproject, 'client');
    /** Create and save invite */
    let invite = new Invite({
      type: 'client',
      sender: user._id,
      project: dbproject._id,
      invitee: client._id,
    });
    invite = await invite.save();
    /** Add invite to client */
    client.invites.push(invite);
    /** Save client */
    client = await client.save();
    /** Save reference to invite */
    invites.push(invite._id);
  });
  /** Add invites to project */
  dbproject.invites = dbproject.invites.concat(invites);
  /** Change owner to owner id if required */
  if (dbproject.owner.id) {
    dbproject.owner = dbproject.owner.id;
  }
  /** Save and return project */
  return await dbproject.save();
}

/**
 * Function to get a list of projects
 * @param {Mongoose:ObjectId} userId Id of the user that's requesting the list
 * @param {Number} skip Skip of the list
 * @param {Number} limit Limit of the list
 * @return {[Mongoose:Project]} Requested list of projects
 */
async function getProjects(userId, skip, limit, type, query) {
  /** Get user */
  const user = await users.findUserById(userId);
  /** Create query */
  const orQuery = [{ clients: user._id }, { owner: user._id }, { managers: user._id }];
  // TODO: fix invalid regular expressions that cause errors
  const regexpQuery = { $regex: new RegExp(query.toLowerCase(), 'i') };
  const searchQuery = { $or: orQuery };
  if (type === 'live') {
    searchQuery.isFinished = false;
  } else if (type === 'finished') {
    searchQuery.isFinished = true;
  }
  if (query) {
    searchQuery.title = regexpQuery;
  }
  /** Get projects */
  const projects = await Project.find(searchQuery)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('_id updatedAt createdAt title description image lastPost lastStatus isFinished owner managers progressEnabled progress')
    .populate([{
      path: 'lastStatus',
      populate: [{
        path: 'author',
        model: 'user',
      }],
    },
    {
      path: 'lastPost',
      populate: [{
        path: 'author',
        model: 'user',
      }],
    }]);
  /** Add canEdit to all projects */
  projects.forEach((project) => {
    project.canEdit = canEdit(project, user);
  });
  /** Return projects */
  return projects;
}

/**
 * Function to get project by id
 * @param {Mongoose:ObjectId} userId Id of the user who is requesting the project
 * @param {Mongoose:ObjectId} projectId Id of the requested project
 * @throws {PROJECT_NOT_FOUND_ERROR} If no project found
 * @return {Mongoose:Project} The requested project
 */
async function getProject(userId, projectId) {
  /** Get user */
  const user = await users.findUserById(userId);
  /** Get project */
  const project = await Project.findById(projectId)
    .populate('lastPost lastStatus clients managers owner')
    .populate({
      path: 'invites',
      populate: [{
        path: 'invitee',
        model: 'user',
      }],
    });
  /** Throw error if no project found */
  if (!project) {
    throw errors.noProjectFound();
  }
  /** Check if authorized to get project */
  checkIfAuthorzed(user, project);
  /** Add canEdit to the project */
  project.canEdit = canEdit(project, user);
  /** Return project */
  return project;
}

/**
 * Fucntion to get invites for the user
 * @param {Mongoose:ObjectId} userId Id of the user who's requesting the list of the invites
 * @return {[Mongoose:Invite]} A list of requested invites
 */
async function getInvites(userId) {
  /** Get user */
  const user = await users.findUserById(userId)
    .select('invites')
    .populate({
      path: 'invites',
      populate: [{
        path: 'sender',
        model: 'user',
      },
      {
        path: 'project',
        model: 'project',
      }],
    });
  /** Return invites */
  return user.invites;
}

/**
 * Function to accept or reject invite
 * @param {Mongoose:ObjectId} userId Id of the users who sends the request
 * @param {Mongoose:ObjectId} inviteId Id of the invite that should be accepted or rejected
 * @param {Boolean} accept True if the invite should be accepted and false if rejected
 * @throws {INVITE_NOT_FOUND_ERROR} If no invite found
 */
async function acceptInvite(userId, inviteId, accept) {
  /** Get user */
  let user = await users.findUserById(userId);
  /** Get invite */
  let invite = await Invite.findById(inviteId)
    .populate('project');
  /** Throw error if no invite found */
  if (!invite) {
    throw errors.noInviteFound();
  }
  /** Check plan */
  await checkPlan(user, false, invite.type !== 'own' || !accept);
  /** Remove invite from user */
  user.invites = user.invites.filter(i => !i.equals(invite._id));
  user = await user.save();
  /** Remove invite from project */
  invite.project.invites = invite.project.invites.filter(i => !i.equals(invite._id));
  invite = await invite.save();
  /** If accept, add user to project */
  if (accept) {
    const project = invite.project;
    if (invite.type === 'manage') {
      project.managers.push(user._id);
      user.projects.push(project._id);
    } else if (invite.type === 'own') {
      project.owner = user._id;
      user.projects.push(project._id);
    } else if (invite.type === 'client') {
      project.clients.push(user._id);
      user.projects.push(project._id);
    }
    await user.save();
    await project.save();
  }
  /** Remove invite from db */
  await invite.remove().exec();
}

/**
 * Function to delete the invite
 * @param {Mongoose:ObjectId} userId Id of the requesting user
 * @param {Mongoose:ObjectId} inviteId Id of the invite to delete
 * @throws {INVITE_NOT_FOUND_ERROR} If no invite found
 * @throws {NOT_AUTHORIZED_ERROR} If not authorized to perform action
 */
async function removeInvite(userId, inviteId) {
  /** Get user */
  const user = await users.findUserById(userId);
  /** Get invite */
  const invite = await Invite.findById(inviteId)
    .populate('project invitee');
  /** Throw error if no invite found */
  if (!invite) {
    throw errors.noInviteFound();
  }
  /** Check if authorized */
  let authorized = false;
  if (invite.project.owner && invite.project.owner.equals(user._id)) {
    authorized = true;
  }
  invite.project.managers.forEach((manager) => {
    if (manager.equals(user._id) && invite.type === 'client') {
      authorized = true;
    }
  });
  if (!authorized) {
    throw errors.notAuthorized();
  }
  /** Remove invite from user */
  invite.invitee.invites = invite.invitee.invites.filter(i => !i.equals(invite._id));
  await invite.invitee.save();
  /** Remove invite from project */
  invite.project.invites = invite.project.invites.filter(i => !i.equals(invite._id));
  await invite.project.save();
  /** Remove invite from db */
  await invite.remove().exec();
}

/**
 * Function to add managers to the project
 * @param {Mongoose:ObjectId} userId Id of the user that's adding managers
 * @param {Mongoose:ObjectId} projectId Id of the project to add managers
 * @param {[String]]} managers List of emails of managers to add
 * @throws {PROJECT_NOT_FOUND_ERROR} If no project found
 * @throws {MANAGER_LIMIT_ERROR} If managers are over limit
 * @throws {NOT_AUTHORIZED_ERROR} If not authorized to perform action
 * @throws {FINISHED_ERROR} If project is finished
 */
async function addManagers(userId, projectId, managers) {
  /** Get user */
  const user = await users.findUserById(userId);
  /** Check plan */
  await checkPlan(user, true);
  /** Get project */
  const project = await Project.findById(projectId);
  /** Throw error if no project found */
  if (!project) {
    throw errors.noProjectFound();
  }
  /** Throw error if too many managers */
  if (project.managers.length >= 100) {
    throw errors.managersOverLimit();
  }
  /** Check if authorized */
  let authorized = false;
  if (project.owner && project.owner.equals(user._id)) {
    authorized = true;
  }
  if (!authorized) {
    throw errors.notAuthorized();
  }
  /** Throw error if project is finished */
  if (project.isFinished) {
    throw errors.projectIsFinished();
  }
  /** Get managers objects */
  const managersObjects = [];
  managers.forEach(async (email) => {
    const manager = await users.findOrCreateUserWithEmail(email);
    managersObjects.push(manager);
  });
  /** Filter managers */
  const existingClients = project.clients.map(v => String(v));
  const existingManagers = project.managers.map(v => String(v));
  const existingInvites = project.invites.map(v => String(v));
  const owner = String(project.owner);

  const filteredManagerObjects = managersObjects.filter((managerObject) => {
    const id = String(managerObject._id);
    const managerInvites = managerObject.invites.map(v => String(v));
    let valid = true;
    existingInvites.forEach((invite) => {
      if (managerInvites.includes(invite)) {
        valid = false;
      }
    });
    if (existingClients.includes(id)) {
      project.clients = project.clients.filter(Client => !Client.equals(id));
      project.managers.push(id);
      valid = false;
    }
    if (existingManagers.includes(id)) {
      valid = false;
    }
    if (owner === id) {
      valid = false;
    }
    if (managerObject.isDemo) {
      valid = false;
    }
    return valid;
  });
  /** Add manager invites */
  const invites = [];
  filteredManagerObjects.forEach(async (manager) => {
    /** Create invite for manager */
    let invite = new Invite({
      type: 'manage',
      sender: user._id,
      project: project._id,
      invitee: manager._id,
    });
    /** Save invite */
    invite = await invite.save();
    /** Add invite to manager */
    manager.invites.push(invite);
    /** Save manager */
    await manager.save();
    /** Notify manager about invite */
    manager.sendInvite(project, 'manager');
    /** Save reference to invite */
    invites.push(invite);
  });
  /** Save invites to project */
  project.invites = project.invites.concat(invites);
  /** Save project */
  await project.save();
}

/**
 * Function to remove manager from project
 * @param {Mongoose:ObjectId} userId If of user who performs the action
 * @param {Mongoose:ObjectId} managerId Id of manager to remove
 * @param {Mongoose:ObjectId} projectId Id of project from where remove the manager
 * @throws {NOT_ENOUGH_PROJECTS_ERROR} If not enough projects on plan
 * @throws {PROJECT_NOT_FOUND_ERROR} If no project found
 * @throws {NOT_AUTHORIZED_ERROR} If not authorized to make this action
 */
async function removeManager(userId, managerId, projectId) {
  /** Get user */
  const user = await users.findUserById(userId);
  /** Check if satisfies plan */
  const projectsOwned = await getProjectsOwned(user._id);
  if (projectsOwned > user.maxProjects()) {
    throw errors.notEnoughProjectsOnPlan();
  }
  /** Get project */
  const project = await Project.findById(projectId);
  /** Check if project exists */
  if (!project) {
    throw errors.noProjectFound();
  }
  /** Check if authorized */
  let authorized = false;
  if (project.owner.equals(user._id)) {
    authorized = true;
  }
  if (!authorized) {
    throw errors.notAuthorized();
  }
  /** Get manager */
  const manager = await users.findUserById(managerId);
  /** Remove project from manager */
  manager.projects = manager.projects.filter(dbProject => String(dbProject) !== projectId);
  await manager.save();
  /** Remove manager from project */
  project.managers = project.managers.filter(pManager => !pManager.equals(manager._id));
  await project.save();
}

/**
 * Function to add clients to the project
 * @param {Mongoose:ObjectId} userId Id of the user that's adding clients
 * @param {Mongoose:ObjectId} projectId Id of the project to add clients
 * @param {[String]]} clients List of emails of clients to add
 * @throws {NOT_ENOUGH_PROJECTS_ERROR} If not enough projects on plan
 * @throws {PROJECT_NOT_FOUND_ERROR} If no project found
 * @throws {USER_LIMIT_ERROR} If too many clients on project
 * @throws {NOT_AUTHORIZED_ERROR} If not authorized to make this action
 * @throws {FINISHED_ERROR} If project is finished
 */
async function addClients(userId, projectId, clients) {
  /** Get user */
  const user = await users.findUserById(userId);
  /** Check if enough projects left on plan */
  const projectsOwned = await getProjectsOwned(user._id);
  if (projectsOwned > user.maxProjects()) {
    throw errors.notEnoughProjectsOnPlan();
  }
  /** Get project */
  const project = await Project.findById(projectId);
  /** Throw error if no project found */
  if (!project) {
    throw errors.noProjectFound();
  }
  /** Throw error if too many clients */
  if (project.clients.length >= 100) {
    throw errors.usersOverLimit();
  }
  /** Check if authorized */
  let authorized = false;
  if (project.owner && project.owner.equals(user._id)) {
    authorized = true;
  }
  project.managers.forEach((manager) => {
    if (manager.equals(user._id)) {
      authorized = true;
    }
  });
  if (!authorized) {
    throw errors.notAuthorized();
  }
  /** Throw error if finished */
  if (project.isFinished) {
    throw errors.projectIsFinished();
  }
  /** Get clients objects */
  const clientsObjects = [];
  clients.forEach(async (email) => {
    const client = await users.findOrCreateUserWithEmail(email);
    clientsObjects.push(client);
  });
  /** Filter clients */
  const existingClients = project.clients.map(v => String(v));
  const existingManagers = project.managers.map(v => String(v));
  const existingInvites = project.invites.map(v => String(v));
  const owner = String(project.owner);

  const filteredClientObjects = clientsObjects.filter((clientObject) => {
    const id = String(clientObject._id);
    const clientInvites = clientObject.invites.map(v => String(v));
    let valid = true;
    if (existingInvites) {
      existingInvites.forEach((invite) => {
        if (clientInvites.includes(invite)) {
          valid = false;
        }
      });
    }
    if (existingClients.includes(id)) {
      valid = false;
    }
    if (existingManagers.includes(id)) {
      if (project.owner.equals(user._id)) {
        project.managers = project.managers.filter(manager => !manager.equals(id));
        project.clients.push(id);
      }
      valid = false;
    }
    if (owner === id) {
      valid = false;
    }
    if (clientObject.isDemo) {
      valid = false;
    }
    return valid;
  });
  /** Add client invites */
  const invites = [];
  filteredClientObjects.forEach(async (client) => {
    /** Notify client about the invite */
    client.sendInvite(project, 'client');
    /** Create invite */
    let invite = new Invite({
      type: 'client',
      sender: user._id,
      project: project._id,
      invitee: client._id,
    });
    /** Save invite */
    invite = await invite.save();
    /** Add invite to client */
    client.invites.push(invite);
    /** Save client */
    client = await client.save();
    /** Save invite reference */
    invites.push(invite);
  });
  /** Add invites to project */
  project.invites = project.invites.concat(invites);
  await project.save();
}

/**
 * Function to remove client from project
 * @param {Mongoose:ObjectId} userId If of user who performs the action
 * @param {Mongoose:ObjectId} clientId Id of client to remove
 * @param {Mongoose:ObjectId} projectId Id of project from where remove the client
 * @throws {NOT_ENOUGH_PROJECTS_ERROR} If not enough projects on plan
 * @throws {PROJECT_NOT_FOUND_ERROR} If no project found
 * @throws {NOT_AUTHORIZED_ERROR} If not authorized to make this action
 */
async function removeClient(userId, clientId, projectId) {
  /** Get user */
  const user = await users.findUserById(userId);
  /** Check projects left on plan */
  const projectsOwned = await getProjectsOwned(user._id);
  if (projectsOwned > user.maxProjects()) {
    throw errors.notEnoughProjectsOnPlan();
  }
  /** Get project */
  const project = await Project.findById(projectId);
  /** Throw error if no project found */
  if (!project) {
    throw errors.noProjectFound();
  }
  /** Check if authorized */
  let authorized = false;
  if (project.owner.equals(user._id)) {
    authorized = true;
  }
  project.managers.forEach((manager) => {
    if (manager.equals(user._id)) {
      authorized = true;
    }
  });
  if (!authorized) {
    throw errors.notAuthorized();
  }
  /** Get client */
  const client = await users.findUserById(clientId);
  /** Remove project from client and save client */
  client.projects = client.projects.filter(pid => String(pid) !== projectId);
  await client.save();
  /** Remove client from project and save project */
  project.clients = project.clients.filter(pclient => !pclient.equals(client._id));
  await project.save();
}

/**
 * Function to edit project
 * @param {Mongoose:ObjectId} userId Id of the user performing action
 * @param {Mongoose:ObjectId} projectId If og the project to change
 * @param {String} title New title of project
 * @param {String} description New description of project
 * @param {String} image S3 key for the new project image
 * @param {Boolean} progressEnabled Whether progress bar is enabled or not
 * @throws {NOT_ENOUGH_PROJECTS_ERROR} If not enough projects on plan
 * @throws {PROJECT_NOT_FOUND_ERROR} If no project found
 * @throws {NOT_AUTHORIZED_ERROR} If not authorized to make this action
 */
async function editProject(userId, projectId, title, description, image, progressEnabled) {
  /** Get user */
  const user = await users.findUserById(userId);
  /** Check if plan is valid */
  const projectsOwned = await getProjectsOwned(user._id);
  if (projectsOwned > user.maxProjects()) {
    throw errors.notEnoughProjectsOnPlan();
  }
  /** Get project */
  const project = await Project.findById(projectId);
  /** Throw error if no project found */
  if (!project) {
    throw errors.noProjectFound();
  }
  /** Check if authorized */
  let authorized = false;
  if (project.owner.equals(user._id)) {
    authorized = true;
  }
  project.managers.forEach((manager) => {
    if (manager.equals(user._id)) {
      authorized = true;
    }
  });
  if (!authorized) {
    throw errors.notAuthorized();
  }
  /** Edit project */
  project.title = title;
  project.description = description;
  project.image = image;
  project.progressEnabled = progressEnabled;
  /** Report edit project */
  reporter.reportEditProject(user, project);
  /** Save project */
  await project.save();
}

/**
 * Function to edit project progress
 * @param {Mongoose:ObjectId} userId Id of the user who edits project
 * @param {Mongoose:ObjectId} projectId Id of project which progress should be changed
 * @param {Number} progress Integer from 0 to 100 representing the progress
 * @throws {NOT_ENOUGH_PROJECTS_ERROR} If not enough projects on plan
 * @throws {PROJECT_NOT_FOUND_ERROR} If no project found
 * @throws {PROGRESS_DISABLED_ERROR} If progress bar is disabled for this project
 * @throws {NOT_AUTHORIZED_ERROR} If not authorized to make this action
 */
async function editProgress(userId, projectId, progress) {
  /** Get user */
  const user = await users.findUserById(userId);
  /** Check if plan is valid */
  const projectsOwned = await getProjectsOwned(user._id);
  if (projectsOwned > user.maxProjects()) {
    throw errors.notEnoughProjectsOnPlan();
  }
  /** Get project */
  const project = await Project.findById(projectId);
  /** Throw error if no project found */
  if (!project) {
    throw errors.noProjectFound();
  }
  /** Check if progress bar is enabled */
  if (project.progressEnabled === false) {
    throw errors.progressDisabled();
  }
  /** Check if authorized */
  let authorized = false;
  if (project.owner.equals(user._id)) {
    authorized = true;
  }
  project.managers.forEach((manager) => {
    if (manager.equals(user._id)) {
      authorized = true;
    }
  });
  if (!authorized) {
    throw errors.notAuthorized();
  }
  /** Change progress */
  project.progress = progress;
  /** Save project */
  await project.save();
}

/**
 * Function to finish the project
 * @param {Mongoose:ObjectId} userId If of user who is finishing the project
 * @param {Mongoose:ObjectId} projectId If of the project to finish
 * @param {Boolean} finish True = finish, false = revive
 * @throws {NOT_AUTHORIZED_ERROR} If not authorized to make this action
 * @throws {NOT_ENOUGH_PROJECTS_ERROR} If not enough projects on plan
 * @return {Mongoose:Project} Resulting project
 */
async function finishProject(userId, projectId, finish) {
  /** Get user */
  const user = await users.findUserById(userId);
  /** Get project */
  const project = await Project.findById(projectId)
    .populate('owner');
  /** Check if authorized */
  if (!project.owner || !project.owner._id.equals(user._id)) {
    throw errors.notAuthorized();
  }
  /** Check if within plan */
  const projectsOwned = await getProjectsOwned(user._id);
  if (projectsOwned >= user.maxProjects() && !finish) {
    throw errors.notEnoughProjectsOnPlan();
  }
  /** Finish or revive project */
  project.isFinished = finish;
  /** Report changing project */
  reporter.reportFinishProject(user, project, finish);
  /** Save project */
  return await project.save();
}

/**
 * Function to delete project
 * @param {Mongoose:ObjectId} userId Id of the user who deletes the project
 * @param {Mongoose:ObjectId} projectId If of the project to delete
 * @throws {PROJECT_NOT_FOUND_ERROR} If no project found
 * @throws {NOT_AUTHORIZED_ERROR} If not authorized to make this action
 */
async function deleteProject(userId, projectId) {
  /** Get user */
  const user = await users.findUserById(userId);
  /** Get project */
  const project = await Project.findById(projectId)
    .populate('clients managers');
  /** Throw error if no project found */
  if (!project) {
    throw errors.noProjectFound();
  }
  /** Check if authorized */
  if (!(project.owner && project.owner.equals(user._id))) {
    throw errors.notAuthorized();
  }
  /** Remove project from owner */
  user.projects = user.projects.filter(id => !id.equals(project._id));
  /** Remove project from clients and managers */
  project.clients.forEach((client) => {
    client.projects = client.projects.filter(id => !id.equals(project._id));
  });
  project.managers.forEach((manager) => {
    manager.projects = manager.projects.filter(id => !id.equals(project._id));
  });
  /** Remove all invites */
  project.invites.forEach(async (id) => {
    await removeInvite(userId, String(id));
  });
  /** Clean up the project */
  project.clients = [];
  project.managers = [];
  project.owner = null;
  /** Save project */
  await project.save();
  /** Save user */
  await user.save();
  /** Save clients */
  project.clients.forEach(async (client) => {
    await client.save();
  });
  /** Save managers */
  project.managers.forEach(async (manager) => {
    await manager.save();
  });
  /** Remove project from db */
  await project.remove().exec();
}

/**
 * Method to leave the project
 * @param {Mongoose:ObjectId} userId If of the user who is leaving the project
 * @param {Mongoose:ObjectId} projectId Id of the project to leave
 * @throws {PROJECT_NOT_FOUND_ERROR} If no project found
 * @throws {LEAVE_AS_OWNER_ERROR} If user is the owner
 * @throws {NOT_AUTHORIZED_ERROR} If not authorized to make this action
 */
async function leaveProject(userId, projectId) {
  /** Get user */
  const user = await users.findUserById(userId);
  /** Get project */
  const project = await Project.findById(projectId);
  /** Throw if no project found */
  if (!project) {
    throw errors.noProjectFound();
  }
  /** Check if user is not an owner */
  if (project.owner && project.owner.equals(user._id)) {
    throw errors.leaveAsOwner();
  }
  /** Check if authorized */
  let authorized = false;
  project.managers.forEach((manager) => {
    if (manager.equals(user._id)) {
      authorized = true;
    }
  });
  project.clients.forEach((client) => {
    if (client.equals(user._id)) {
      authorized = true;
    }
  });
  if (!authorized) {
    throw errors.notAuthorized();
  }
  /** Remove project from user */
  user.projects = user.projects.filter(id => String(id) !== projectId);
  /** Remove user from project managers */
  project.managers = project.managers.filter(pManager => !pManager.equals(user._id));
  /** Remove user from project clients */
  project.clients = project.clients.filter(pClient => !pClient.equals(user._id));
  /** Save user */
  await user.save();
  /** Save project */
  await project.save();
}

/**
 * Function to add initial status to project if specified
 * @param {Object} options.project JS object representing project
 * @param {Mongoose:User} options.author User that's going to be the author of the first status
 */
async function addInitialStatus(project, author) {
  if (project.initialStatus) {
    let initialStatus = new Post({
      type: 'status',
      text: project.initialStatus,
      author,
    });
    initialStatus = await initialStatus.save();
    project.posts = [initialStatus];
    project.lastPost = initialStatus;
    project.lastStatus = initialStatus;
  }
  return project;
}

/**
 * Function that checks user authorization on project
 * @param {Mongoose:User} user User whos permission needs to be checked
 * @param {Mongoose:Project} project Project to which permissions should be checked
 * @throws {NOT_AUTHORIZED_ERROR} If not authorized
 */
function checkIfAuthorzed(user, project) {
  let authorized = false;
  if (project.owner && project.owner._id.equals(user._id)) {
    authorized = true;
  }
  project.managers.forEach((manager) => {
    if (manager._id.equals(user._id)) {
      authorized = true;
    }
  });
  project.clients.forEach((client) => {
    if (client._id.equals(user._id)) {
      authorized = true;
    }
  });
  project.invites.forEach((invite) => {
    if (invite.invitee._id.equals(user._id)) {
      authorized = true;
    }
  });
  if (!authorized) {
    throw errors.notAuthorized();
  }
}

/** Function to verify if user can edit project */
function canEdit(project, user) {
  let can = false;
  if (project.owner && (project.owner.equals(user._id) ||
    (project.owner._id && project.owner._id.equals(user._id)))) {
    can = true;
  }
  project.managers.forEach((manager) => {
    if (manager.equals(user._id) ||
      (manager._id && manager._id.equals(user._id))) {
      can = true;
    }
  });
  return can;
}

/**
 * Function to check if user has enough available projects on plan
 * @param {Mongoose:User} user User whos plan to check
 * @param {Boolean} allowsEqual If true, checks if number of projects owned is greater
 * than allowed, greater than or equals otherwise
 * @param {Boolean} bypass If true, just returns true; checks otherwise
 * @throws {NOT_ENOUGH_PROJECTS_ERROR} If not enough projects on plan
 */
async function checkPlan(user, allowsEqual, bypass) {
  if (!bypass) {
    const projectsOwned = await getProjectsOwned(user._id);
    if (allowsEqual && projectsOwned > user.maxProjects()) {
      throw errors.notEnoughProjectsOnPlan();
    } else if (projectsOwned >= user.maxProjects()) {
      throw errors.notEnoughProjectsOnPlan();
    }
  }
}

/**
 * Function to get count of projects owned
 * @param {Mongoose:ObjectId} userId Id of the user
 * @return {Int} Count of projects owned
 */
async function getProjectsOwned(userId) {
  return await Project.count({ owner: userId, isFinished: false }).exec();
}

module.exports = {
  addProject,
  getProjects,
  getProject,
  getInvites,
  acceptInvite,
  removeInvite,
  addManagers,
  removeManager,
  addClients,
  removeClient,
  editProject,
  editProgress,
  finishProject,
  deleteProject,
  leaveProject,
  getProjectsOwned,
};
