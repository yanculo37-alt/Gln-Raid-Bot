const { createToken, releaseToken } = require('./cancelStore');

const CAT_GIFS = [
  'https://media1.giphy.com/media/v1.Y2lkPTZjMDliOTUyNGZ0bTk0aDBteTU3N29mZzQzemk4eGVydnY5eHIyNGIyZ3c2cDhvbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/gSQp32H82WETR5EFO6/giphy.gif',
  'https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUyd3N4azRqam9xaDBveWY2bjk1dTJ0YXdoZnN6ZHRyZ2l4MmN0b3MxdSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/drE27r3RbngLgqnYpW/giphy.gif',
  'https://media4.giphy.com/media/v1.Y2lkPTZjMDliOTUyeTFpaWR2czVqb2ppMGptdnBqaHNwZHJmN2RlY2Zhd2g2aHNvY25yMiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/cbm0J4DEIqKHsKxYHA/giphy.gif',
  'https://media1.giphy.com/media/v1.Y2lkPTZjMDliOTUyNTgwejY1cW1xZXBwdjFmNWV3N2l1dGZkd3prdGIyZzVmYXdiaGx3NSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Ev477g37MJORyOWfdG/giphy.gif',
  'https://media4.giphy.com/media/v1.Y2lkPTZjMDliOTUyYWs4Mzh1NHVqb2lzaXJ1YzR6cThnZ3Jzc2c5b3licTc5aTA5NGozNCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/7NNqJw0T3cb62PMzXR/giphy.gif',
  'https://media3.giphy.com/media/v1.Y2lkPTZjMDliOTUyczd4ampzZ3V3YWV5anBweW1vOXFpaHV5b3RteWc0MTNiamI0azR2ZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/93mS3A87wfmOySC29W/giphy.gif',
];

const CAT_RAID_COUNT = 5;

function pickRandom() {
  return CAT_GIFS[Math.floor(Math.random() * CAT_GIFS.length)];
}

module.exports = async function catRaidStart(interaction, client) {
  try { await interaction.deferUpdate(); } catch {}

  const parts = (interaction.customId || '').split(':');
  const ownerId = parts[1];
  if (ownerId && ownerId !== interaction.user.id) return;

  client.logger.info(`cat raid triggered by ${interaction.user.tag} (${interaction.user.id}) in ${interaction.guildId || 'DM'}`);

  const token = createToken(interaction.user.id);
  try {
    for (let i = 0; i < CAT_RAID_COUNT; i++) {
      if (token.cancelled) break;
      try {
        await interaction.followUp({ content: pickRandom() });
      } catch (e) {
        client.logger.warn('cat r4id send failed:', e.message);
      }
    }
  } finally {
    releaseToken(token);
  }
};
