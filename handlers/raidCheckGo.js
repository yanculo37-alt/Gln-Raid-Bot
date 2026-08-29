const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { container, V2_EPHEMERAL } = require('../events/ui');

const RAID_GIF = 'https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUyenRuODJrbTRwZWdzYmVyYmw3ZnR3OGRyaG41ZXp2M2gzZjZubWk5OCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/FaqR5QheFTwwgwfQLf/giphy.gif';

module.exports = async function raidCheckGo(interaction) {
  const parts = (interaction.customId || '').split(':');
  const ownerId = parts[1];
  if (ownerId && ownerId !== interaction.user.id) return;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`raid_start:${interaction.user.id}`)
      .setLabel('Start R4id')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('💥'),
  );

  const c = container({
    title: 'GLN R4id',
    body: 'use the button below to start the r4id',
    images: [RAID_GIF],
    rows: [row],
  });

  try {
    await interaction.update({ flags: V2_EPHEMERAL, components: [c] });
  } catch {}
};
