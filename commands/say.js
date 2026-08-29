const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
  ApplicationIntegrationType,
} = require('discord.js');
const { container, V2_EPHEMERAL } = require('../events/ui');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Make the bot say anything')
    .addStringOption((o) => o.setName('message').setDescription('What to say').setRequired(true).setMaxLength(2000))
    .addBooleanOption((o) => o.setName('embed').setDescription('Send the message inside of a container').setRequired(false))
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall),
  async execute(interaction) {
    const msg = interaction.options.getString('message', true);
    const asEmbed = interaction.options.getBoolean('embed') ?? false;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`say_send:${interaction.user.id}:${asEmbed ? 1 : 0}:${interaction.id}`)
        .setLabel('Send Publicly')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🚀'),
    );

    // Store the raw message on the interaction so saySend can pull it back
    // even when the preview container isn't parsed. Discord doesn't persist
    // arbitrary state, so we also embed the message directly in the preview.
    const c = container({
      title: 'Message Preview',
      body: `${asEmbed ? '_will be sent inside a container_\n\n' : ''}${msg}`,
      rows: [row],
    });

    await interaction.editReply({ flags: V2_EPHEMERAL, components: [c] });
  },
};
