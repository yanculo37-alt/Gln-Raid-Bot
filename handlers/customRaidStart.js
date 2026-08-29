const { createToken, releaseToken } = require('./cancelStore');
const { container, V2_FLAGS } = require('../events/ui');

const customRaidStore = new Map();
const CUSTOM_RAID_COUNT = 5;

async function customRaidStart(interaction, client) {
  try { await interaction.deferUpdate(); } catch {}

  const parts = (interaction.customId || '').split(':');
  const token = parts[1];
  const entry = token ? customRaidStore.get(token) : null;

  if (!entry) {
    try {
      await interaction.followUp({ content: 'This custom r4id has expired. Run /custom r4id again.', ephemeral: true });
    } catch {}
    return;
  }

  if (entry.userId !== interaction.user.id) return;

  entry.ts = Date.now();

  client.logger.info(`custom raid triggered by ${interaction.user.tag} (${interaction.user.id}) in ${interaction.guildId || 'DM'}`);

  const cancelToken = createToken(interaction.user.id);
  try {
    for (let i = 0; i < CUSTOM_RAID_COUNT; i++) {
      if (cancelToken.cancelled) break;
      try {
        if (entry.asEmbed) {
          const c = container({ body: entry.message });
          await interaction.followUp({
            flags: V2_FLAGS,
            components: [c],
            allowedMentions: { parse: ['everyone', 'roles', 'users'] },
          });
        } else {
          await interaction.followUp({
            content: entry.message,
            allowedMentions: { parse: ['everyone', 'roles', 'users'] },
          });
        }
      } catch (e) {
        client.logger.warn('custom r4id send failed:', e.message);
      }
    }
  } finally {
    releaseToken(cancelToken);
  }
}

module.exports = customRaidStart;
module.exports.customRaidStore = customRaidStore;
