const { MessageFlags } = require('discord.js');

const V2_EPHEMERAL = MessageFlags.Ephemeral | MessageFlags.IsComponentsV2;

function isUnknownInteraction(error) {
  return error?.code === 10062 || String(error?.message || '').includes('Unknown interaction');
}

async function acknowledge(interaction, logger) {
  if (!interaction?.isRepliable?.() || interaction.deferred || interaction.replied) return true;
  try {
    await interaction.deferReply({ flags: V2_EPHEMERAL });
    return true;
  } catch (error) {
    if (isUnknownInteraction(error)) {
      logger?.warn?.('Discord interaction expired before it could be acknowledged.');
      return false;
    }
    throw error;
  }
}

async function respond(interaction, options) {
  if (interaction.deferred || interaction.replied) {
    const { flags, ...editOptions } = options;
    return interaction.editReply(editOptions);
  }
  return interaction.reply({ ...options, flags: options.flags ?? V2_EPHEMERAL });
}

async function notify(interaction, options) {
  try {
    if (interaction.deferred || interaction.replied) {
      return interaction.followUp({ ...options, flags: options.flags ?? V2_EPHEMERAL });
    }
    return interaction.reply({ ...options, flags: options.flags ?? V2_EPHEMERAL });
  } catch (error) {
    if (isUnknownInteraction(error) || error?.code) return null;
    throw error;
  }
}

module.exports = { acknowledge, respond, notify, isUnknownInteraction, V2_EPHEMERAL };
