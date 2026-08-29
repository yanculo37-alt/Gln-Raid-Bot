const config = require('../config.json');
const {
  container,
  text,
  separator,
  V2_FLAGS,
  LOG_COLOR,
} = require('./ui');
const {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
} = require('discord.js');

function ts() { return new Date().toISOString(); }

function fmt(args) {
  return args
    .map((a) => (typeof a === 'string' ? a : (() => { try { return JSON.stringify(a); } catch { return String(a); } })()))
    .join(' ');
}

function write(level, args) {
  const line = `[${ts()}] [${level}] ${fmt(args)}`;
  const method = level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'log';
  console[method](line);
}

let clientRef = null;
function setClient(c) { clientRef = c; }

async function getLogChannel() {
  const id = config.logs?.logChannelId;
  if (!id || !clientRef) return null;
  try {
    const ch = await clientRef.channels.fetch(id).catch(() => null);
    if (ch && ch.isTextBased?.()) return ch;
  } catch (_) {}
  return null;
}

function collectArguments(interaction) {
  const out = {};
  try {
    const opts = interaction.options?.data || [];
    const walk = (list) => {
      for (const opt of list) {
        if (opt.options && opt.options.length) {
          walk(opt.options);
        } else if (opt.name != null && opt.value !== undefined) {
          out[opt.name] = opt.value;
        }
      }
    };
    walk(opts);
  } catch (_) {}
  return out;
}

// Resolve where the command was ran. If it happened in a guild, return the
// guild's name (falling back to its id). Otherwise report "DMs".
function resolveLocation(interaction) {
  if (interaction.guild?.name) return interaction.guild.name;
  if (interaction.guildId) return interaction.guildId;
  return 'DMs';
}

async function commandLog(interaction, extra = {}) {
  const ch = await getLogChannel();
  if (!ch) return;
  try {
    const sub = (() => {
      try { return interaction.options?.getSubcommand?.(false); } catch { return null; }
    })();
    const cmdLine = `/${interaction.commandName}${sub ? ` ${sub}` : ''}`;
    const args = { ...collectArguments(interaction), ...extra };
    const argsStr = Object.keys(args).length
      ? '```json\n' + JSON.stringify(args, null, 2) + '\n```'
      : '```\n(none)\n```';

    const location = resolveLocation(interaction);
    const locationLine = interaction.guildId
      ? `**[** *location* **]** \`${location}\` (\`${interaction.guildId}\`)`
      : `**[** *location* **]** \`${location}\``;

    const userAvatar =
      interaction.user?.displayAvatarURL?.({ size: 256, extension: 'png' }) ||
      interaction.user?.displayAvatarURL?.() ||
      null;

    const headerBody =
      `# command executed\n` +
      `**[** *user* **]** \`${interaction.user.tag}\`\n` +
      `**[** *user id* **]** \`${interaction.user.id}\`\n` +
      `**[** *ping* **]** <@${interaction.user.id}>\n` +
      `${locationLine}\n\n` +
      `> \`${cmdLine}\` ran successfully`;

    const c = new ContainerBuilder().setAccentColor(LOG_COLOR);

    if (userAvatar) {
      const section = new SectionBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(headerBody))
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(userAvatar));
      c.addSectionComponents(section);
    } else {
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerBody));
    }

    c.addSeparatorComponents(separator());
    c.addTextDisplayComponents(text('**[ arguments ]**\n' + argsStr));
    c.addSeparatorComponents(separator());
    c.addTextDisplayComponents(text(`-# interaction id: \`${interaction.id || 'n/a'}\``));

    ch.send({ flags: V2_FLAGS, components: [c], allowedMentions: { parse: [] } }).catch(() => {});
  } catch (_) {}
}

// Console-level helpers stay console-only. The log channel receives command
// executions only via commandLog().
module.exports = {
  setClient,
  commandLog,
  info:  (...a) => { write('INFO', a); },
  warn:  (...a) => { write('WARN', a); },
  error: (...a) => { write('ERROR', a); },
  debug: (...a) => { write('DEBUG', a); },
};
