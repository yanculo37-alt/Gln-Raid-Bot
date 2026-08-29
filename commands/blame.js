const {
  SlashCommandBuilder,
  InteractionContextType,
  ApplicationIntegrationType,
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
} = require('discord.js');
const { increment } = require('../events/raidStats');
const { V2_FLAGS, BRAND_COLOR } = require('../events/ui');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blame')
    .setDescription('Blame someone for ordering the r4id')
    .addUserOption((o) => o.setName('user').setDescription('Who to blame').setRequired(true))
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall),
  async execute(interaction, client) {
    const user = interaction.options.getUser('user', true);
    const total = increment();

    const body = [
      'thanks for using GLN',
      '',
      `user: <@${user.id}>`,
      '',
      `amount of r4ids done using GLN: **${total}**`,
      '',
      'we LOVE r4iding :3',
    ].join('\n');

    const avatarUrl = user.displayAvatarURL({ size: 256, extension: 'png' });

    const section = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# GLN Raid\n\n${body}`),
      )
      .setThumbnailAccessory(new ThumbnailBuilder().setURL(avatarUrl));

    const c = new ContainerBuilder()
      .setAccentColor(BRAND_COLOR)
      .addSectionComponents(section);

    try {
      await interaction.deleteReply().catch(() => {});
      await interaction.followUp({
        flags: V2_FLAGS,
        components: [c],
        allowedMentions: { users: [user.id] },
        ephemeral: false,
      });
    } catch (e) {
      client.logger.warn('blame send failed:', e.message);
    }
  },
};
