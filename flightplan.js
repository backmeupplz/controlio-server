const plan = require('flightplan');

const appName = 'controlio';
const username = 'deploy';

const tmpDir = `${appName}-${new Date().getTime()}`;

/** Configuration */
plan.target('contorlio', [
  {
    host: '162.243.76.239',
    username,
    agent: process.env.SSH_AUTH_SOCK,
    privateKey: '/Users/BackMeUpPlz/.ssh/id_rsa',
  },
]);

plan.local((local) => {
  local.log('Copy files to remote hosts');
  const filesToCopy = local.exec('git ls-files', { silent: true });
  local.transfer(filesToCopy, `/tmp/${tmpDir}`);
});

plan.remote((remote) => {
  remote.log('Move folder to root');
  remote.sudo(`cp -R /tmp/${tmpDir} ~`, { user: username });
  remote.rm(`-rf /tmp/${tmpDir}`);

  remote.log('Install dependencies');
  remote.sudo(`npm --production --prefix ~/${tmpDir} install ~/${tmpDir}`, { user: username });

  remote.log('Reload application');
  remote.sudo(`ln -snf ~/${tmpDir} ~/${appName}`, { user: username });
  remote.exec('sudo systemctl restart controlio');
});
