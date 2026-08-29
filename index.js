const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');
const config = require('./config.json');
const logger = require('./events/logger');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember],
});

client.commands = new Collection();
client.config = config;
client.logger = logger;
logger.setClient(client);

const commandsJSON = [];
const commandsDir = path.join(__dirname, 'commands');
if (fs.existsSync(commandsDir)) {
  for (const file of fs.readdirSync(commandsDir).filter((f) => f.endsWith('.js'))) {
    try {
      const cmd = require(path.join(commandsDir, file));
      if (cmd?.data?.name && typeof cmd.execute === 'function') {
        client.commands.set(cmd.data.name, cmd);
        if (cmd.data.toJSON) commandsJSON.push(cmd.data.toJSON());
        logger.info(`Loaded command /${cmd.data.name}`);
      }
    } catch (e) {
      logger.error(`Failed to load command ${file}:`, e.message);
    }
  }
}

const eventsDir = path.join(__dirname, 'events');
if (fs.existsSync(eventsDir)) {
  const NON_EVENT_FILES = new Set([
    'deploy-commands.js',
    'interactionReplies.js',
    'logger.js',
    'raidStats.js',
    'ui.js',
  ]);
  for (const file of fs.readdirSync(eventsDir).filter((f) => f.endsWith('.js') && !NON_EVENT_FILES.has(f))) {
    try {
      const evt = require(path.join(eventsDir, file));
      if (!evt?.name) continue;
      if (evt.once) client.once(evt.name, (...args) => evt.execute(...args, client));
      else client.on(evt.name, (...args) => evt.execute(...args, client));
      logger.info(`Loaded event ${evt.name}`);
    } catch (e) {
      logger.error(`Failed to load event ${file}:`, e.message);
    }
  }
}

process.on('unhandledRejection', (r) => logger.error('unhandledRejection:', r?.stack || r));
process.on('uncaughtException',  (e) => logger.error('uncaughtException:',  e?.stack || e));

if (!config.token || config.token === 'YOUR_BOT_TOKEN_HERE') {
  logger.error('Missing bot token in config.json');
  process.exit(1);
}
if (!config.clientId || config.clientId === 'YOUR_CLIENT_ID_HERE') {
  logger.error('Missing clientId in config.json');
  process.exit(1);
}

(async () => {
  try {
    const rest = new REST({ version: '10' }).setToken(config.token);
    logger.info(`Registering ${commandsJSON.length} global slash command(s)...`);
    const data = await rest.put(Routes.applicationCommands(config.clientId), { body: commandsJSON });
    logger.info(`Registered ${data.length} command(s) with Discord.`);
  } catch (e) {
    logger.error('Command registration failed:', e?.message || e);
  }

  client.login(config.token).catch((e) => {
    logger.error('Login failed:', e.message);
    process.exit(1);
  });
})();
