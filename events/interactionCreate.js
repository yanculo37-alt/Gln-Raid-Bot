const { Events, MessageFlags } = require('discord.js');
const { acknowledge, notify, isUnknownInteraction } = require('./interactionReplies');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    const cfg = client.config;
    const log = client.logger;

    // Acknowledge FIRST (before anything else) to avoid the 3s Discord timeout
    // that produces "application did not respond" / "Unknown interaction (10062)".
    let acknowledged = false;
    if (interaction.isChatInputCommand()) {
      acknowledged = await acknowledge(interaction, log);
      if (!acknowledged) return;
    }

    if (interaction.guildId && Array.isArray(cfg.blacklistedGuilds) && cfg.blacklistedGuilds.includes(interaction.guildId)) {
      log.warn(`Blocked interaction from blacklisted guild ${interaction.guildId}`);
      if (interaction.isRepliable()) {
        try {
          if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: 'This bot is not permitted in this server.' });
          } else {
            await interaction.reply({ content: 'This bot is not permitted in this server.', flags: MessageFlags.Ephemeral });
          }
        } catch (_) {}
      }
      return;
    }

    try {
      if (interaction.isChatInputCommand()) {
        const cmd = client.commands.get(interaction.commandName);
        if (!cmd) {
          await interaction.editReply({ content: 'This command is unavailable.' });
          return;
        }
        await cmd.execute(interaction, client);
        // Log successful command execution to the log channel (styled embed).
        log.commandLog(interaction).catch(() => {});
      } else if (interaction.isButton()) {
        const id = (interaction.customId || '').split(':')[0];
        if (id === 'raid_start') {
          const handler = require('../handlers/raidStart');
          await handler(interaction, client);
        } else if (id === 'say_send') {
          const handler = require('../handlers/saySend');
          await handler(interaction, client);
        } else if (id === 'raid_check_go') {
          const handler = require('../handlers/raidCheckGo');
          await handler(interaction, client);
        } else if (id === 'custom_raid_start') {
          const handler = require('../handlers/customRaidStart');
          await handler(interaction, client);
        } else if (id === 'funk_start') {
          const handler = require('../handlers/funkStart');
          await handler(interaction, client);
        } else if (id === 'rap_start') {
          const handler = require('../handlers/rapStart');
          await handler(interaction, client);
        } else if (id === 'cat_raid_start') {
          const handler = require('../handlers/catRaidStart');
          await handler(interaction, client);
        } else if (id === 'fake_nitro_accept') {
          const handler = require('../handlers/fakeNitroAccept');
          await handler(interaction, client);
        } else if (id === 'rick_nitro_accept') {
          const handler = require('../handlers/rickNitroAccept');
          await handler(interaction, client);
        }
      }
    } catch (e) {
      if (isUnknownInteraction(e)) {
        log.warn('Interaction expired before the bot could answer.');
        return;
      }
      log.error('Interaction error:', e?.stack || e);
      await notify(interaction, { content: 'An error occurred.' });
    }
  },
};
