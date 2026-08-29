const { ActivityType, Events } = require('discord.js');

const BOT_NAME = 'GLN';

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    try {
      client.user.setPresence({
        activities: [{ name: 'over GLN r4ids', type: ActivityType.Watching }],
        status: 'online',
      });
    } catch (_) {}
    client.botName = BOT_NAME;
    client.logger.info(`Logged in as ${client.user.tag} (${client.user.id})`);
    client.logger.info(`Servicing ${client.guilds.cache.size} guild(s)`);
  },
};
