const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
  ApplicationIntegrationType,
} = require('discord.js');
const { container, V2_EPHEMERAL } = require('../events/ui');

const CAT_UI_GIF =
  'https://media1.giphy.com/media/v1.Y2lkPTZjMDliOTUyNGZ0bTk0aDBteTU3N29mZzQzemk4eGVydnY5eHIyNGIyZ3c2cDhvbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/gSQp32H82WETR5EFO6/giphy.gif';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cat')
    .setDescription('Cat commands')
    .addSubcommand((s) => s.setName('r4id').setDescription('Spam random cat gifs into the channel'))
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall),
  async execute(interaction) {
    if (interaction.options.getSubcommand() !== 'r4id') return;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`cat_raid_start:${interaction.user.id}`)
        .setLabel('Start Cat R4id')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🐱'),
    );

    const c = container({
      title: 'GLN Cat R4id',
      body: 'use the button below to start the cat r4id',
      images: [CAT_UI_GIF],
      rows: [row],
    });

    await interaction.editReply({ flags: V2_EPHEMERAL, components: [c] });
  },
};
