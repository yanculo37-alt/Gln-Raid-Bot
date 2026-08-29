const { createToken, releaseToken } = require('./cancelStore');

const RAID_LINE = '# JOIN GLN TO START R4IDING ANY TYPE OF SERVER!';
const INVITE = 'https://discord.gg/qKS2XZb9gz';

function buildRaidMessage() {
  const block1 = Array(15).fill(RAID_LINE).join('\n');
  const block2 = Array(8).fill(RAID_LINE).join('\n');
  return `@everyone\n\n${block1}\n\n${block2}\n\n${INVITE}`;
}

const RAID_MESSAGE_COUNT = 5;

module.exports = async function raidStart(interaction, client) {
  try { await interaction.deferUpdate(); } catch {}

  client.logger.info(`raid triggered by ${interaction.user.tag} (${interaction.user.id}) in ${interaction.guildId || 'DM'}`);

  const token = createToken(interaction.user.id);
  const content = buildRaidMessage();
  try {
    for (let i = 0; i < RAID_MESSAGE_COUNT; i++) {
      if (token.cancelled) break;
      try {
        await interaction.followUp({
          content,
          allowedMentions: { parse: ['everyone', 'roles', 'users'] },
        });
      } catch (e) {
        client.logger.warn('r4id send failed:', e.message);
      }
    }
  } finally {
    releaseToken(token);
  }
};
