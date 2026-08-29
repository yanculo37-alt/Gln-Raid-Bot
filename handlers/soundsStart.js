const path = require('path');
const fs = require('fs');
const { AttachmentBuilder } = require('discord.js');

const MESSAGE_COUNT = 5;

function listSounds(dir) {
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => /\.(mp3|wav|ogg|m4a|flac)$/i.test(f))
      .map((f) => path.join(dir, f));
  } catch (_) {
    return [];
  }
}

function pickRandom(arr, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(arr[Math.floor(Math.random() * arr.length)]);
  }
  return out;
}

function makeHandler(kind) {
  const dir = path.join(__dirname, '..', 'sounds', kind);
  return async function (interaction, client) {
    try { await interaction.deferUpdate(); } catch {}
    client.logger.info(`${kind} sounds triggered by ${interaction.user.tag} (${interaction.user.id})`);

    const sounds = listSounds(dir);
    if (!sounds.length) {
      try {
        await interaction.followUp({ content: `No ${kind} sounds are available.`, ephemeral: true });
      } catch {}
      return;
    }

    const picks = pickRandom(sounds, MESSAGE_COUNT);
    for (const file of picks) {
      const attachment = new AttachmentBuilder(file, { name: path.basename(file) });
      try {
        await interaction.followUp({ files: [attachment] });
      } catch (e) {
        client.logger.warn(`${kind} send failed:`, e.message);
      }
    }
  };
}

module.exports = { makeHandler };
