const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
  ApplicationIntegrationType,
} = require('discord.js');
const { container, V2_EPHEMERAL } = require('../events/ui');

const RAID_GIF = 'https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUyenRuODJrbTRwZWdzYmVyYmw3ZnR3OGRyaG41ZXp2M2gzZjZubWk5OCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/FaqR5QheFTwwgwfQLf/giphy.gif';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ad')
    .setDescription('Advertisement commands')
    .addSubcommand((s) => s.setName('r4id').setDescription('Show the GLN r4id ad with a Start button'))
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall),
  async execute(interaction) {
    if (interaction.options.getSubcommand() !== 'r4id') return;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`raid_start:${interaction.user.id}`)
        .setLabel('Start R4id')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('💥'),
    );

    const c = container({
      title: 'GLN R4id',
      body: 'use the button below to start the r4id',
      images: [RAID_GIF],
      rows: [row],
    });

    await interaction.editReply({ flags: V2_EPHEMERAL, components: [c] });
  },
};
