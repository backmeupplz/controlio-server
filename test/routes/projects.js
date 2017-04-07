const test = require('unit.js');
const helper = require('../helper');
const config = require('../../config');
const db = require('../../helpers/db');

describe('routes/projects.js', () => {
  const email = 'test@controlio.co';
  const managerEmail = 'manager@controlio.co';
  const demoEmail = 'awesome@controlio.co';
  const clientEmails = [
    'client1@controlio.co',
    'client2@controlio.co',
    'client3@controlio.co',
  ];
  let user;
  let managerObject;
  let clientObjects;

  before((done) => {
    helper.closeConnectDrop()
      .then(() => helper.addUserWithJWT({ email, plan: 3 }))
      .then((dbuser) => {
        user = dbuser;
      })
      .then(() => helper.addUserWithJWT({ email: demoEmail, isDemo: true }))
      .then(() => done())
      .catch(done);
  });
  after((done) => {
    helper.dropClose()
      .then(done)
      .catch(done);
  });

  /** POST /projects */
  it('creates a project as a client', (done) => {
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'Test client',
        type: 'client',
        description: 'Test project description',
        initialStatus: 'Test initial status',
        managerEmail,
        image: 'key/to/test/image.png',
      })
      .expect(200, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test
            .object(json)
              .hasProperty('title', 'Test client')
              .hasProperty('description', 'Test project description')
              .hasProperty('isFinished', false)
              .hasProperty('image', 'key/to/test/image.png')
              .hasNotProperty('owner')
              .array(json.posts)
                .hasLength(1)
                .object(json.posts[0])
                  .hasProperty('text', 'Test initial status')
                  .hasProperty('isEdited', false)
                  .hasProperty('type', 'status')
                  .array(json.posts[0].attachments)
                    .hasLength(0)
              .array(json.invites)
                .hasLength(1)
              .array(json.clients)
                .hasLength(1)
                .object(json.clients[0])
                  .hasProperty('email', email)
              .array(json.managers)
                .hasLength(0)
              .object(json.lastPost)
                .hasProperty('text', 'Test initial status')
                .hasProperty('isEdited', false)
                .hasProperty('type', 'status')
                .array(json.posts[0].attachments)
                  .hasLength(0)
              .object(json.lastStatus)
                .hasProperty('text', 'Test initial status')
                .hasProperty('isEdited', false)
                .hasProperty('type', 'status')
                .array(json.posts[0].attachments)
                  .hasLength(0);
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('invites manager after creating a project as a client', (done) => {
    db.findUser({ email: managerEmail })
      .then((manager) => {
        test.object(manager.toObject())
          .hasProperty('email', managerEmail)
          .array(manager.toObject().invites)
            .hasLength(1);
        done();
      })
      .catch(done);
  });
  it('creates a project without image, description, client emails and initial status as a client', (done) => {
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'Test client almost empty',
        type: 'client',
        managerEmail,
      })
      .expect(200, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test
            .object(json)
              .hasProperty('title', 'Test client almost empty')
              .hasNotProperty('description')
              .hasProperty('isFinished', false)
              .hasNotProperty('image')
              .hasNotProperty('owner')
              .hasNotProperty('lastPost')
              .hasNotProperty('lastStatus')
              .array(json.posts)
                .hasLength(0)
              .array(json.invites)
                .hasLength(1)
              .array(json.clients)
                .hasLength(1)
                .object(json.clients[0])
                  .hasProperty('email', email)
              .array(json.managers)
                .hasLength(0);
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('creates third project a client', (done) => {
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'Test client third',
        type: 'client',
        managerEmail,
      })
      .expect(200, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test
            .object(json)
              .hasProperty('title', 'Test client third')
              .hasNotProperty('description')
              .hasProperty('isFinished', false)
              .hasNotProperty('image')
              .hasNotProperty('owner')
              .hasNotProperty('lastPost')
              .hasNotProperty('lastStatus')
              .array(json.posts)
                .hasLength(0)
              .array(json.invites)
                .hasLength(1)
              .array(json.clients)
                .hasLength(1)
                .object(json.clients[0])
                  .hasProperty('email', email)
              .array(json.managers)
                .hasLength(0);
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('does not create manager object twice', (done) => {
    db.findUsers({ email: managerEmail })
      .then((users) => {
        test.array(users)
          .hasLength(1);
        done();
      })
      .catch(done);
  });
  it('returns error creating a project with malformed manager email as client', (done) => {
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        type: 'client',
        title: 'SHould fail',
        managerEmail: '123',
      })
      .expect(400, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('type', 'VALIDATION_ERROR');
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('returns error creating a project without title', (done) => {
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        type: 'client',
        managerEmail,
      })
      .expect(400, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('type', 'VALIDATION_ERROR');
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('returns error creating a project without type', (done) => {
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'Test client without type',
        managerEmail,
      })
      .expect(400, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('type', 'VALIDATION_ERROR');
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('returns error creating a project without managerEmail as a client', (done) => {
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'Test client without manager email',
        type: 'client',
      })
      .expect(400, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('type', 'VALIDATION_ERROR');
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('returns error creating a project with manager email too long', (done) => {
    const stub = '1234567890';
    let manager = stub;
    for (let i = 0; i < 11; i += 1) {
      manager += stub;
    }
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'Manager email that is too long',
        type: 'client',
        managerEmail: `${manager}@controlio.co`,
      })
      .expect(400, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('type', 'VALIDATION_ERROR');
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('returns error creating a project as client with self as manager', (done) => {
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'Self as manager',
        type: 'client',
        managerEmail: email,
      })
      .expect(400, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('type', 'ADD_SELF_AS_MANAGER_ERROR');
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('returns error creating a project as client with demo as manager', (done) => {
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'Demo as manager',
        type: 'client',
        managerEmail: demoEmail,
      })
      .expect(403, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('type', 'ADD_DEMO_AS_MANAGER_ERROR');
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('returns error creating a project with strange type', (done) => {
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'Test client without manager email',
        type: 'strange',
        managerEmail,
      })
      .expect(400, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('type', 'VALIDATION_ERROR');
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('returns error creating a project with title too long', (done) => {
    const stub = '1234567890';
    let title = stub;
    for (let i = 0; i < 30; i += 1) {
      title += stub;
    }
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title,
        type: 'client',
        managerEmail,
      })
      .expect(400, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('type', 'VALIDATION_ERROR');
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('returns error creating a project with description too long', (done) => {
    const stub = '1234567890';
    let description = stub;
    for (let i = 0; i < 101; i += 1) {
      description += stub;
    }
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'description that is too long',
        description,
        type: 'client',
        managerEmail,
      })
      .expect(400, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('type', 'VALIDATION_ERROR');
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('returns error creating a project with initial status too long', (done) => {
    const stub = '1234567890';
    let initialStatus = stub;
    for (let i = 0; i < 30; i += 1) {
      initialStatus += stub;
    }
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'Initial status that is too long',
        initialStatus,
        type: 'client',
        managerEmail,
      })
      .expect(400, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('type', 'VALIDATION_ERROR');
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('creates a project as a manager', (done) => {
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'Test manager',
        type: 'manager',
        description: 'Test project description for manager',
        initialStatus: 'Test initial status for manager',
        image: 'key/to/test/image_for_manager.png',
        clientEmails,
      })
      .expect(200, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test
            .object(json)
              .hasProperty('title', 'Test manager')
              .hasProperty('description', 'Test project description for manager')
              .hasProperty('isFinished', false)
              .hasProperty('image', 'key/to/test/image_for_manager.png')
              .hasProperty('owner')
              .array(json.posts)
                .hasLength(1)
                .object(json.posts[0])
                  .hasProperty('text', 'Test initial status for manager')
                  .hasProperty('isEdited', false)
                  .hasProperty('type', 'status')
                  .array(json.posts[0].attachments)
                    .hasLength(0)
              .array(json.invites)
                .hasLength(3)
              .array(json.clients)
                .hasLength(0)
              .array(json.managers)
                .hasLength(0)
              .object(json.lastPost)
                .hasProperty('text', 'Test initial status for manager')
                .hasProperty('isEdited', false)
                .hasProperty('type', 'status')
                .array(json.posts[0].attachments)
                  .hasLength(0)
              .object(json.lastStatus)
                .hasProperty('text', 'Test initial status for manager')
                .hasProperty('isEdited', false)
                .hasProperty('type', 'status')
                .array(json.posts[0].attachments)
                  .hasLength(0);
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('invites clients after creating a project as a manager', (done) => {
    Promise.reduce(clientEmails, (array, clientEmail) =>
      db.findUser({ email: clientEmail })
        .then((client) => {
          array.push(client);
          return array;
        }), [])
      .then((clients) => {
        clients.forEach((client, index) => {
          test.object(client.toObject())
            .hasProperty('email', clientEmails[index])
            .array(client.toObject().invites)
              .hasLength(1);
        });
        done();
      })
      .catch(done);
  });
  it('creates a project without image, description, manager email and initial status as a manager', (done) => {
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'Test manager almost empty',
        type: 'manager',
        clientEmails,
      })
      .expect(200, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test
            .object(json)
              .hasProperty('title', 'Test manager almost empty')
              .hasNotProperty('description')
              .hasProperty('isFinished', false)
              .hasNotProperty('image')
              .hasProperty('owner')
              .hasNotProperty('lastPost')
              .hasNotProperty('lastStatus')
              .array(json.posts)
                .hasLength(0)
              .array(json.invites)
                .hasLength(3)
              .array(json.clients)
                .hasLength(0)
              .array(json.managers)
                .hasLength(0);
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('does not create client objects twice', (done) => {
    Promise.reduce(clientEmails, (array, clientEmail) =>
      db.findUser({ email: clientEmail })
        .then((client) => {
          array.push(client);
          return array;
        }), [])
      .then((clients) => {
        test.array(clients)
          .hasLength(3);
        done();
      })
      .catch(done);
  });
  it('returns error creating a project with malformed client email as manager', (done) => {
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'Should fail',
        type: 'manager',
        clientEmails: ['123'],
      })
      .expect(400, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('type', 'VALIDATION_ERROR');
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('returns error creating a project without client emails as a manager', (done) => {
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'Test manager without client emails',
        type: 'manager',
      })
      .expect(400, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('type', 'VALIDATION_ERROR');
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('returns error creating a project with clients emails too long', (done) => {
    const stub = '1234567890';
    let client = stub;
    for (let i = 0; i < 11; i += 1) {
      client += stub;
    }
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'Client emails that are too long',
        type: 'manager',
        clientEmails: [`${client}@controlio.co`],
      })
      .expect(400, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('type', 'VALIDATION_ERROR');
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('returns error creating a project as client with self as client', (done) => {
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'Self as client',
        type: 'manager',
        clientEmails: [email],
      })
      .expect(400, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('type', 'ADD_SELF_AS_CLIENT_ERROR');
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('returns error creating a project as client with demo as client', (done) => {
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'Demo as client',
        type: 'manager',
        clientEmails: [demoEmail],
      })
      .expect(403, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('type', 'ADD_DEMO_AS_CLIENT_ERROR');
          done();
        } catch (error) {
          done(error);
        }
      });
  });

  /** POST projects/invite */
  it('grabs manager object and client objects, has correct number of invites on each', (done) => {
    Promise.reduce(clientEmails.concat(managerEmail), (array, inemail) =>
      db.findUser({ email: inemail })
        .then(helper.generateJWT)
        .then(helper.maximizePlan)
        .then((dbuser) => {
          array.push(dbuser);
          return array;
        }), [])
      .then((users) => {
        managerObject = users[3];
        test.object(managerObject.toObject())
          .hasProperty('invites')
          .array(managerObject.toObject().invites)
            .hasLength(3);
        clientObjects = users.slice(0, 3);
        clientObjects.forEach((clientObject) => {
          test.object(clientObject.toObject())
            .hasProperty('invites')
            .array(clientObject.toObject().invites)
            .hasLength(2);
        });
        done();
      })
      .catch(done);
  });
  it('returns an error when not providing invite id on accept invite', (done) => {
    helper.request
      .post('/projects/invite')
      .set('apiKey', config.apiKey)
      .set('token', managerObject.token)
      .send({
        accept: true,
      })
      .expect(400, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('type', 'VALIDATION_ERROR');
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('returns an error when not providing accept value on accept invite', (done) => {
    helper.request
      .post('/projects/invite')
      .set('apiKey', config.apiKey)
      .set('token', managerObject.token)
      .send({
        inviteid: String(managerObject.invites[1]),
      })
      .expect(400, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('type', 'VALIDATION_ERROR');
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('returns an error when providing non existing invite id on accept invite', (done) => {
    helper.request
      .post('/projects/invite')
      .set('apiKey', config.apiKey)
      .set('token', managerObject.token)
      .send({
        inviteid: '58e73c820a9f165ffc06c1cf',
        accept: true,
      })
      .expect(400, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('type', 'INVITE_NOT_FOUND_ERROR');
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('returns an error when providing non existing invite id on reject invite', (done) => {
    helper.request
      .post('/projects/invite')
      .set('apiKey', config.apiKey)
      .set('token', managerObject.token)
      .send({
        inviteid: '58e73c820a9f165ffc06c1cf',
        accept: false,
      })
      .expect(400, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('type', 'INVITE_NOT_FOUND_ERROR');
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('correctly accepts invite for owner', (done) => {
    helper.request
      .post('/projects/invite')
      .set('apiKey', config.apiKey)
      .set('token', managerObject.token)
      .send({
        inviteid: String(managerObject.invites[1]),
        accept: true,
      })
      .expect(200, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('success', true);
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('removes invite from owner afterwards and adds project to owner', (done) => {
    db.findUser({ email: managerEmail })
      .select('+token')
      .then((object) => {
        managerObject = object;
        const objectifiedManager = managerObject.toObject();
        test.object(objectifiedManager)
          .array(objectifiedManager.invites)
            .hasLength(2)
          .array(objectifiedManager.projects)
            .hasLength(1);
        done();
      })
      .catch(done);
  });
  it('correctly rejects invite for owner', (done) => {
    helper.request
      .post('/projects/invite')
      .set('apiKey', config.apiKey)
      .set('token', managerObject.token)
      .send({
        inviteid: String(managerObject.invites[1]),
        accept: false,
      })
      .expect(200, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('success', true);
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('removes invite from owner afterwards and does not add project to owner', (done) => {
    db.findUser({ email: managerEmail })
      .select('+token')
      .then((object) => {
        managerObject = object;
        const objectifiedManager = managerObject.toObject();
        test.object(objectifiedManager)
          .array(objectifiedManager.invites)
            .hasLength(1)
          .array(objectifiedManager.projects)
            .hasLength(1);
        done();
      })
      .catch(done);
  });
  it('correctly accepts invite for client', (done) => {
    const firstClient = clientObjects[0];
    helper.request
      .post('/projects/invite')
      .set('apiKey', config.apiKey)
      .set('token', firstClient.token)
      .send({
        inviteid: String(firstClient.invites[0]),
        accept: true,
      })
      .expect(200, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('success', true);
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('removes invite from client afterwards and adds project to client', (done) => {
    db.findUser({ email: clientEmails[0] })
      .select('+token')
      .then((object) => {
        const clientObject = object;
        clientObjects[0] = clientObject;
        const objectifiedClient = clientObject.toObject();
        test.object(objectifiedClient)
          .array(objectifiedClient.invites)
            .hasLength(1)
          .array(objectifiedClient.projects)
            .hasLength(1);
        done();
      })
      .catch(done);
  });
  it('correctly rejects invite for client', (done) => {
    const secondClient = clientObjects[1];
    helper.request
      .post('/projects/invite')
      .set('apiKey', config.apiKey)
      .set('token', secondClient.token)
      .send({
        inviteid: String(secondClient.invites[0]),
        accept: false,
      })
      .expect(200, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('success', true);
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('removes invite from client afterwards and does not add project to client', (done) => {
    db.findUser({ email: clientEmails[1] })
      .select('+token')
      .then((object) => {
        const clientObject = object;
        clientObjects[1] = clientObject;
        const objectifiedClient = clientObject.toObject();
        test.object(objectifiedClient)
          .array(objectifiedClient.invites)
            .hasLength(1)
          .array(objectifiedClient.projects)
            .hasLength(0);
        done();
      })
      .catch(done);
  });

  /** DELETE /projects/invite */
  it('returns an error when providing non existing invite id on delete invite', (done) => {
    helper.request
      .delete('/projects/invite')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        inviteid: '58e73c820a9f165ffc06c1cf',
      })
      .expect(400, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('type', 'INVITE_NOT_FOUND_ERROR');
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('returns an error when providing no invite id on delete invite', (done) => {
    helper.request
      .delete('/projects/invite')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
      })
      .expect(400, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('type', 'VALIDATION_ERROR');
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('does not allow to delete invite for manager by client', (done) => {
    helper.request
      .delete('/projects/invite')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        inviteid: String(managerObject.invites[0]),
      })
      .expect(403, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('type', 'NOT_AUTHORIZED_ERROR');
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('correctly allows to remove invite for client', (done) => {
    helper.request
      .delete('/projects/invite')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        inviteid: String(clientObjects[2].invites[0]),
      })
      .expect(200, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('success', true);
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('removes invite from client afterwards and does not add project to client', (done) => {
    db.findUser({ email: clientEmails[2] })
      .select('+token')
      .then((object) => {
        const clientObject = object;
        clientObjects[2] = clientObject;
        const objectifiedClient = clientObject.toObject();
        test.object(objectifiedClient)
          .array(objectifiedClient.invites)
            .hasLength(1)
          .array(objectifiedClient.projects)
            .hasLength(0);
        done();
      })
      .catch(done);
  });

  /** GET /projects/project */
  it('returns error on getting project with empty project id', (done) => {
    helper.request
      .get('/projects/project')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .expect(400, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('type', 'VALIDATION_ERROR');
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('returns error on getting project with non existing project id', (done) => {
    helper.request
      .get('/projects/project')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .query({
        projectid: '58e73c820a9f165ffc06c1cf',
      })
      .expect(400, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('type', 'PROJECT_NOT_FOUND_ERROR');
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('grabs user', (done) => {
    db.findUser({ email })
      .select('+token')
      .then((dbuser) => {
        user = dbuser;
        done();
      })
      .catch(done);
  });
  it('returns error on getting project that does not include getter', (done) => {
    helper.request
      .get('/projects/project')
      .set('apiKey', config.apiKey)
      .set('token', clientObjects[2].token)
      .query({
        projectid: String(user.projects[0]),
      })
      .expect(403, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('type', 'NOT_AUTHORIZED_ERROR');
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('correctly fetches project by client', (done) => {
    helper.request
      .get('/projects/project')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .query({
        projectid: String(user.projects[0]),
      })
      .expect(200, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('title', 'Test client')
            .hasProperty('description', 'Test project description')
            .hasProperty('image', 'key/to/test/image.png')
            .hasProperty('isFinished', false)
            .hasProperty('canEdit', false);
          done();
        } catch (error) {
          done(error);
        }
      });
  });
  it('correctly fetches project by manager', (done) => {
    helper.request
      .get('/projects/project')
      .set('apiKey', config.apiKey)
      .set('token', managerObject.token)
      .query({
        projectid: String(managerObject.projects[0]),
      })
      .expect(200, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('title', 'Test client almost empty')
            .hasNotProperty('description')
            .hasNotProperty('image')
            .hasProperty('isFinished', false)
            .hasProperty('canEdit', true);
          done();
        } catch (error) {
          done(error);
        }
      });
  });
});
