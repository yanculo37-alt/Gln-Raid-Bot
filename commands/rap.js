const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
  ApplicationIntegrationType,
} = require('discord.js');
const { container, V2_EPHEMERAL } = require('../events/ui');

const RAP_GIF = 'https://media2.giphy.com/media/v1.Y2lkPTZjMDliOTUybW5nNmtiNjkyZWZwODluaGxvb2E2ZXdvZG16ZTZ5N3VrNHJyOTlhdyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/wl2tFqxRUyS4D2Imel/giphy.gif';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rap')
    .setDescription('Rap related commands')
    .addSubcommand((s) => s.setName('sounds').setDescription('Show the rap sounds panel with a Start button'))
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall),
  async execute(interaction) {
    if (interaction.options.getSubcommand() !== 'sounds') return;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`rap_start:${interaction.user.id}`)
        .setLabel('Start Rap')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🎤'),
    );

    const c = container({
      title: 'Rap Sounds',
      body: 'use the button below to send 5 random rap sounds',
      images: [RAP_GIF],
      rows: [row],
    });

    await interaction.editReply({ flags: V2_EPHEMERAL, components: [c] });
  },
};
