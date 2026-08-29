const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
  ApplicationIntegrationType,
} = require('discord.js');
const { container, V2_EPHEMERAL } = require('../events/ui');

const FUNK_GIF = 'https://media4.giphy.com/media/v1.Y2lkPTZjMDliOTUyN3hiN2gwY3l0NHhtZnF0NGloeTA2cHZ4NTVtNnNybnA2ODd2eTF6bSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/SotN6ZHyhYvFhKq1Y8/giphy.gif';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('funk')
    .setDescription('Funk related commands')
    .addSubcommand((s) => s.setName('sounds').setDescription('Show the funk sounds panel with a Start button'))
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall),
  async execute(interaction) {
    if (interaction.options.getSubcommand() !== 'sounds') return;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`funk_start:${interaction.user.id}`)
        .setLabel('Start Funk')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🎧'),
    );

    const c = container({
      title: 'Funk Sounds',
      body: 'use the button below to send 5 random funk sounds',
      images: [FUNK_GIF],
      rows: [row],
    });

    await interaction.editReply({ flags: V2_EPHEMERAL, components: [c] });
  },
};
