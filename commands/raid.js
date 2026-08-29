const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  InteractionContextType,
  ApplicationIntegrationType,
} = require('discord.js');
const { container, V2_EPHEMERAL, GREEN, RED } = require('../events/ui');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('r4id')
    .setDescription('R4id utilities')
    .addSubcommand((s) => s.setName('check').setDescription('Check if this channel is r4idable'))
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall),
  async execute(interaction) {
    if (interaction.options.getSubcommand() !== 'check') return;

    let r4idable = false;
    let canPingEveryone = false;
    let isAdmin = false;

    if (!interaction.guildId) {
      r4idable = true;
      canPingEveryone = true;
    } else {
      let perms = null;
      try {
        if (interaction.channel && typeof interaction.channel.permissionsFor === 'function') {
          let member = interaction.member;
          if (interaction.guild && interaction.guild.members && typeof interaction.guild.members.fetch === 'function') {
            try { member = await interaction.guild.members.fetch(interaction.user.id); } catch {}
          }
          if (member) perms = interaction.channel.permissionsFor(member);
        }
      } catch {}
      if (!perms) perms = interaction.memberPermissions || null;

      if (perms) {
        isAdmin = perms.has(PermissionFlagsBits.Administrator);
        r4idable = isAdmin || perms.has(PermissionFlagsBits.UseExternalApps);
        canPingEveryone = isAdmin || perms.has(PermissionFlagsBits.MentionEveryone);
      }
    }

    const pingLine = `can you ping everyone? **${canPingEveryone ? 'yes' : 'no'}**`;

    if (r4idable) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`raid_check_go:${interaction.user.id}`)
          .setLabel('click me to r4id!!!!!!')
          .setStyle(ButtonStyle.Success),
      );

      const c = container({
        color: GREEN,
        title: 'r4idable!!1!1!1!!',
        body: `you have **UseExternalApps** permission in this channel\n\n${pingLine}`,
        rows: [row],
      });

      await interaction.editReply({ flags: V2_EPHEMERAL, components: [c] });
    } else {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('raid_check_none')
          .setLabel('not r4idable')
          .setStyle(ButtonStyle.Danger)
          .setDisabled(true),
      );

      const c = container({
        color: RED,
        title: 'not r4idable!!1!1!1!!',
        body: `you don't have **UseExternalApps** permission in this channel\n\n${pingLine}`,
        rows: [row],
      });

      await interaction.editReply({ flags: V2_EPHEMERAL, components: [c] });
    }
  },
};
