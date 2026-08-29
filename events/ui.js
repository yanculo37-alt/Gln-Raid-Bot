// Shared Components V2 helpers.
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ActionRowBuilder,
  MessageFlags,
} = require('discord.js');

const BRAND_COLOR = 0x8a2be2;
const GREEN = 0x2ecc71;
const RED = 0xe74c3c;
const LOG_COLOR = 0x5865f2;

const V2_FLAGS = MessageFlags.IsComponentsV2;
const V2_EPHEMERAL = MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;

function text(md) {
  return new TextDisplayBuilder().setContent(md);
}

function separator(large = false) {
  return new SeparatorBuilder().setSpacing(large ? SeparatorSpacingSize.Large : SeparatorSpacingSize.Small);
}

function gallery(...urls) {
  const g = new MediaGalleryBuilder();
  for (const u of urls) {
    if (!u) continue;
    g.addItems(new MediaGalleryItemBuilder().setURL(u));
  }
  return g;
}

/**
 * Build a Components V2 container.
 * @param {Object} opts
 * @param {number} [opts.color]
 * @param {string} [opts.title]      Rendered as **# title** TextDisplay.
 * @param {string} [opts.body]       Body markdown.
 * @param {string[]} [opts.images]   Media gallery image URLs.
 * @param {Array} [opts.rows]        ActionRowBuilder instances (buttons).
 * @param {Array} [opts.extras]      Extra Text/Separator components to append after body.
 */
function container({ color = BRAND_COLOR, title, body, images = [], rows = [], extras = [] } = {}) {
  const c = new ContainerBuilder().setAccentColor(color);
  if (title) c.addTextDisplayComponents(text(`# ${title}`));
  if (body) c.addTextDisplayComponents(text(body));
  for (const extra of extras) {
    if (!extra) continue;
    if (extra instanceof SeparatorBuilder) c.addSeparatorComponents(extra);
    else if (extra instanceof TextDisplayBuilder) c.addTextDisplayComponents(extra);
  }
  const filteredImages = (images || []).filter(Boolean);
  if (filteredImages.length) c.addMediaGalleryComponents(gallery(...filteredImages));
  for (const row of rows) {
    if (row instanceof ActionRowBuilder) c.addActionRowComponents(row);
  }
  return c;
}

function v2Payload(builder, { ephemeral = false, allowedMentions } = {}) {
  const flags = ephemeral ? V2_EPHEMERAL : V2_FLAGS;
  const payload = { flags, components: [builder] };
  if (allowedMentions) payload.allowedMentions = allowedMentions;
  return payload;
}

module.exports = {
  BRAND_COLOR,
  GREEN,
  RED,
  LOG_COLOR,
  V2_FLAGS,
  V2_EPHEMERAL,
  text,
  separator,
  gallery,
  container,
  v2Payload,
};
