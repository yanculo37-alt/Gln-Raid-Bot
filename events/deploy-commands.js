const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const config = require('../config.json');
const logger = require('./logger');

(async () => {
  const commands = [];
  const dir = path.join(__dirname, '..', 'commands');
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    const cmd = require(path.join(dir, file));
    if (cmd?.data?.toJSON) commands.push(cmd.data.toJSON());
  }

  if (!config.token || !config.clientId) {
    logger.error('token and clientId are required in config.json');
    process.exit(1);
  }

  const rest = new REST({ version: '10' }).setToken(config.token);
  try {
    logger.info(`Deploying ${commands.length} global commands...`);
    const data = await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
    logger.info(`Deployed ${data.length} commands successfully.`);
  } catch (e) {
    logger.error('Deploy failed:', e);
    process.exit(1);
  }
})();
