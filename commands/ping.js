const {
  SlashCommandBuilder,
  InteractionContextType,
  ApplicationIntegrationType,
  ContainerBuilder,
  TextDisplayBuilder,
} = require('discord.js');
const { V2_FLAGS, BRAND_COLOR } = require('../events/ui');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot latency')
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall),
  async execute(interaction, client) {
    const wsPing = Math.max(0, Math.round(client.ws.ping));
    const roundtrip = Date.now() - interaction.createdTimestamp;

    const body = [
      '# GLN Ping',
      '',
      `**Websocket:** ${wsPing}ms`,
      `**Roundtrip:** ${roundtrip}ms`,
    ].join('\n');

    const c = new ContainerBuilder()
      .setAccentColor(BRAND_COLOR)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(body));

    try {
      await interaction.deleteReply().catch(() => {});
      await interaction.followUp({
        flags: V2_FLAGS,
        components: [c],
        ephemeral: false,
      });
    } catch (e) {
      client.logger.warn('ping send failed:', e.message);
    }
  },
};
