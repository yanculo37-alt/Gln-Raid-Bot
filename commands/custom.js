const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
  ApplicationIntegrationType,
} = require('discord.js');
const { customRaidStore } = require('../handlers/customRaidStart');
const { container, V2_EPHEMERAL } = require('../events/ui');

const CUSTOM_GIF = 'https://media3.giphy.com/media/v1.Y2lkPTZjMDliOTUybnBieW02aHJrZ2swdWN6aHRzZ3cyam9iM3Y3dW1hZXVyNnBjdHd4dSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/vobi6V06uahg2oZ8wM/giphy.gif';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('custom')
    .setDescription('Custom utilities')
    .addSubcommand((s) =>
      s
        .setName('r4id')
        .setDescription('Send a custom message 5 times using a Start button')
        .addStringOption((o) =>
          o.setName('message').setDescription('The message to spam 5 times').setRequired(true).setMaxLength(2000),
        )
        .addBooleanOption((o) =>
          o.setName('embed').setDescription('Send the messages inside of a container').setRequired(false),
        ),
    )
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall),
  async execute(interaction) {
    if (interaction.options.getSubcommand() !== 'r4id') return;

    const message = interaction.options.getString('message', true);
    const asEmbed = interaction.options.getBoolean('embed') ?? false;
    const token = `${interaction.user.id}_${Date.now()}`;
    customRaidStore.set(token, { message, userId: interaction.user.id, ts: Date.now(), asEmbed });

    for (const [key, value] of customRaidStore) {
      if (Date.now() - value.ts > 60 * 60 * 1000) customRaidStore.delete(key);
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`custom_raid_start:${token}`)
        .setLabel('Start R4id')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('💥'),
    );

    const c = container({
      title: 'Custom R4id',
      body: 'use the button below to send your custom message **5 times** (click as many times as you want)',
      images: [CUSTOM_GIF],
      rows: [row],
    });

    await interaction.editReply({ flags: V2_EPHEMERAL, components: [c] });
  },
};
