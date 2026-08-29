const { container, V2_FLAGS } = require('../events/ui');

module.exports = async function saySend(interaction, client) {
  const parts = (interaction.customId || '').split(':');
  const ownerId = parts[1];
  const asEmbed = parts[2] === '1';
  if (ownerId && ownerId !== interaction.user.id) return;

  let msg = '';
  try {
    const comp = interaction.message?.components?.[0];
    const children = comp?.components || [];
    const texts = children
      .filter((x) => x?.type === 10 && typeof x.content === 'string')
      .map((x) => x.content);
    const body = texts[1] || texts[0] || '';
    msg = body.replace(/^_will be sent inside a container_\n\n/, '').trim();
  } catch {}

  if (!msg) return;

  try { await interaction.deferUpdate(); } catch {}

  try {
    if (asEmbed) {
      const c = container({ body: msg });
      await interaction.followUp({
        flags: V2_FLAGS,
        components: [c],
        allowedMentions: { parse: ['users', 'roles', 'everyone'] },
      });
    } else {
      await interaction.followUp({
        content: msg,
        allowedMentions: { parse: ['users', 'roles', 'everyone'] },
      });
    }
  } catch (e) {
    client.logger.warn('say send failed:', e.message);
  }
};
