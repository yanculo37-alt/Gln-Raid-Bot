// Rick Nitro "Accept Gift" button handler.
// Anyone can click it. On click the clicker (and only the clicker) gets an
// ephemeral rickroll gif.

const RICKROLL_GIF = 'https://git.cosmin.gg/rickroll.gif';

module.exports = async function rickNitroAccept(interaction, client) {
  client.logger.info(
    `rick nitro accepted by ${interaction.user.tag} (${interaction.user.id}) in ${interaction.guildId || 'DM'}`,
  );

  try {
    await interaction.reply({
      content: RICKROLL_GIF,
      ephemeral: true,
      allowedMentions: { parse: [] },
    });
  } catch (e) {
    client.logger.warn('rick nitro reply failed:', e.message);
    try {
      await interaction.followUp({
        content: RICKROLL_GIF,
        ephemeral: true,
        allowedMentions: { parse: [] },
      });
    } catch (_) {}
  }
};
