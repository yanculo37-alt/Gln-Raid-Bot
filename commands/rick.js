const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  InteractionContextType,
  ApplicationIntegrationType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} = require('discord.js');
const path = require('path');
const { V2_FLAGS } = require('../events/ui');

const NITRO_COLOR = 0xB57BEE;
const NITRO_IMAGE_PATH = path.join(__dirname, '..', 'assets', 'nitro.png');

function buildData() {
  return new SlashCommandBuilder()
    .setName('rick')
    .setDescription('Rick stuff')
    .addSubcommand((s) =>
      s.setName('nitro').setDescription('Send a rick troll nitro'),
    )
    .setContexts(
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    )
    .setIntegrationTypes(
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall,
    );
}

async function runNitro(interaction, client) {
  const attachment = new AttachmentBuilder(NITRO_IMAGE_PATH, { name: 'nitro.png' });
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('rick_nitro_accept')
      .setLabel('Accept Gift')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setLabel('Learn More')
      .setStyle(ButtonStyle.Link)
      .setURL('https://discord.com/nitro'),
  );
  const c = new ContainerBuilder()
    .setAccentColor(NITRO_COLOR)
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL('attachment://nitro.png'),
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("## You've been gifted a subscription!"),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**GLN R41DS** has gifted you Nitro for **3 months!**\n-# Expires in 24hours`,
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addActionRowComponents(row);

  try {
    await interaction.deleteReply().catch(() => {});
    await interaction.followUp({
      flags: V2_FLAGS,
      components: [c],
      files: [attachment],
      allowedMentions: { parse: [] },
      ephemeral: false,
    });
  } catch (e) {
    client?.logger?.warn?.('rick nitro send failed:', e.message);
  }
}

module.exports = {
  data: buildData(),
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'nitro') return runNitro(interaction, client);
  },
};
