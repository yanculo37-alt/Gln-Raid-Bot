const {
  SlashCommandBuilder,
  InteractionContextType,
  ApplicationIntegrationType,
  AttachmentBuilder,
} = require('discord.js');
const sharp = require('sharp');
const { container, v2Payload, RED } = require('../events/ui');

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB safety cap
const ACCEPTED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/bmp', 'image/tiff', 'image/avif', 'image/gif'];

async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed (${res.status})`);
  const len = Number(res.headers.get('content-length') || 0);
  if (len && len > MAX_BYTES) throw new Error('image too large (>25MB)');
  const ab = await res.arrayBuffer();
  if (ab.byteLength > MAX_BYTES) throw new Error('image too large (>25MB)');
  return Buffer.from(ab);
}

async function toGif(buffer) {
  return sharp(buffer, { animated: true })
    .gif({ effort: 7 })
    .toBuffer();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gif')
    .setDescription('Convert an image into a .gif')
    .addAttachmentOption((o) =>
      o.setName('image').setDescription('The image to convert (png/jpg/webp/bmp/tiff/avif/gif)').setRequired(true),
    )
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall),

  async execute(interaction, client) {
    const attachment = interaction.options.getAttachment('image', true);

    if (!interaction.deferred && !interaction.replied) {
      try {
        await interaction.deferReply();
      } catch {}
    }

    const ct = (attachment.contentType || '').toLowerCase().split(';')[0].trim();
    if (ct && !ACCEPTED.includes(ct)) {
      const c = container({
        color: RED,
        title: 'GLN Gif',
        body: `Unsupported file type: \`${ct}\`\nAccepted: png, jpg, webp, bmp, tiff, avif, gif`,
      });
      return interaction.editReply(v2Payload(c)).catch(() => {});
    }

    if (attachment.size && attachment.size > MAX_BYTES) {
      const c = container({
        color: RED,
        title: 'GLN Gif',
        body: 'Image is too large. Max size is 25MB.',
      });
      return interaction.editReply(v2Payload(c)).catch(() => {});
    }

    try {
      const src = await fetchBuffer(attachment.url);
      const gifBuf = await toGif(src);

      const baseName = (attachment.name || 'image').replace(/\.[^.]+$/, '') || 'image';
      const file = new AttachmentBuilder(gifBuf, { name: `${baseName}.gif` });
      const gifUrl = `attachment://${baseName}.gif`;

      const c = container({
        title: 'GLN Gif',
        images: [gifUrl],
      });

      const payload = v2Payload(c);
      payload.files = [file];
      await interaction.editReply(payload);
    } catch (err) {
      client.logger?.warn?.('gif convert failed:', err.message);
      const c = container({
        color: RED,
        title: 'GLN Gif',
        body: `Failed to convert image.\n\`\`\`${(err.message || String(err)).slice(0, 400)}\`\`\``,
      });
      await interaction.editReply(v2Payload(c)).catch(() => {});
    }
  },
};
