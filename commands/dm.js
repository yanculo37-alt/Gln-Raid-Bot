const {
  SlashCommandBuilder,
  InteractionContextType,
  ApplicationIntegrationType,
} = require('discord.js');
const { container, V2_EPHEMERAL, GREEN, RED } = require('../events/ui');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dm')
    .setDescription('DM a user a chosen message')
    .addUserOption((o) => o.setName('user').setDescription('Who to DM').setRequired(true))
    .addStringOption((o) => o.setName('message').setDescription('What to send').setRequired(true).setMaxLength(2000))
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall),
  async execute(interaction, client) {
    const user = interaction.options.getUser('user', true);
    const msg = interaction.options.getString('message', true);

    if (user.bot) {
      const c = container({
        color: RED,
        title: 'DM Failed',
        body: 'You cannot DM a bot.',
      });
      await interaction.editReply({ flags: V2_EPHEMERAL, components: [c] });
      return;
    }

    try {
      await user.send({ content: msg });
      const c = container({
        color: GREEN,
        title: 'DM Sent',
        body: `Successfully sent a DM to <@${user.id}>.\n\n**Message:**\n${msg}`,
      });
      await interaction.editReply({ flags: V2_EPHEMERAL, components: [c] });
    } catch (e) {
      client.logger?.warn?.('dm send failed:', e?.message || e);
      const c = container({
        color: RED,
        title: 'DM Failed',
        body: `Could not DM <@${user.id}>. They may have DMs disabled or block the bot.`,
      });
      await interaction.editReply({ flags: V2_EPHEMERAL, components: [c] });
    }
  },
};
