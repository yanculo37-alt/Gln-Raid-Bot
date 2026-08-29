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
  MessageFlags,
} = require('discord.js');
const path = require('path');
const { V2_FLAGS } = require('../events/ui');
const { renderConversation, resolveProfile } = require('../handlers/fakeConversationRender');

const NITRO_COLOR = 0xB57BEE;
const NITRO_IMAGE_PATH = path.join(__dirname, '..', 'assets', 'nitro.png');

function buildData() {
  const b = new SlashCommandBuilder()
    .setName('fake')
    .setDescription('Fake stuff')
    .addSubcommand((s) =>
      s.setName('nitro').setDescription('Send a fake Discord Nitro gift message'),
    )
    .addSubcommand((s) => {
      s.setName('conversation').setDescription('Generate a fake Discord conversation image');
      s.addUserOption((o) => o.setName('user1').setDescription('User 1').setRequired(true));
      s.addStringOption((o) => o.setName('msg1').setDescription('Message 1').setRequired(true));
      s.addStringOption((o) =>
        o.setName('time').setDescription('Time like 5:55 or 17:25').setRequired(true),
      );
      for (let i = 2; i <= 10; i++) {
        s.addUserOption((o) => o.setName(`user${i}`).setDescription(`User ${i}`).setRequired(false));
        s.addStringOption((o) => o.setName(`msg${i}`).setDescription(`Message ${i}`).setRequired(false));
      }
      s.addBooleanOption((o) =>
        o
          .setName('user_usernames')
          .setDescription('Show @usernames instead of display names (default: false)')
          .setRequired(false),
      );
      s.addBooleanOption((o) =>
        o.setName('ephemeral').setDescription('Only you can see it (default: true)').setRequired(false),
      );
      return s;
    })
    .setContexts(
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    )
    .setIntegrationTypes(
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall,
    );
  return b;
}

async function runNitro(interaction, client) {
  const attachment = new AttachmentBuilder(NITRO_IMAGE_PATH, { name: 'nitro.png' });
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('fake_nitro_accept')
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
    client?.logger?.warn?.('fake nitro send failed:', e.message);
  }
}

async function runConversation(interaction, client) {
  const ephemeral = interaction.options.getBoolean('ephemeral');
  const isEphemeral = ephemeral === null ? true : ephemeral;
  const useUsernames = interaction.options.getBoolean('user_usernames') === true;
  const timeInput = interaction.options.getString('time', true);

  const pairs = [];
  for (let i = 1; i <= 10; i++) {
    const u = interaction.options.getUser(`user${i}`);
    const m = interaction.options.getString(`msg${i}`);
    if (u && m) pairs.push({ user: u, content: m });
  }
  if (!pairs.length) {
    await interaction.followUp({ content: 'need at least user1 and msg1', ephemeral: true }).catch(() => {});
    return;
  }

  const guild = interaction.guild || null;
  const profileCache = new Map();
  const messages = [];
  for (const p of pairs) {
    let full = p.user;
    try { full = await client.users.fetch(p.user.id, { force: true }); } catch (_) {}
    let profile = profileCache.get(full.id);
    if (!profile) {
      profile = await resolveProfile(full, guild, { useUsernames, client });
      profile.userId = full.id;
      profileCache.set(full.id, profile);
    }
    messages.push({ profile, content: p.content });
  }

  let buf;
  try {
    buf = await renderConversation({ messages, timeInput, guild });
  } catch (e) {
    client?.logger?.warn?.('fake conversation render failed:', e.message);
    await interaction.followUp({ content: 'failed to render image', ephemeral: true }).catch(() => {});
    return;
  }

  const file = new AttachmentBuilder(buf, { name: 'conversation.png' });
  const payload = {
    files: [file],
    allowedMentions: { parse: [] },
  };
  if (isEphemeral) payload.flags = MessageFlags.Ephemeral;

  try {
    await interaction.deleteReply().catch(() => {});
    await interaction.followUp(payload);
  } catch (e) {
    client?.logger?.warn?.('fake conversation send failed:', e.message);
  }
}

module.exports = {
  data: buildData(),
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'nitro') return runNitro(interaction, client);
    if (sub === 'conversation') return runConversation(interaction, client);
  },
};
