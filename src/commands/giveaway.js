import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import giveawayStore from '../utils/giveawayStore.js';
import config from '../config.js';

function genId() { return `g${Date.now().toString(36)}${Math.floor(Math.random()*9000)+1000}`; }

export default {
  async execute(interaction) {
    // Defer tidlig for å unngå "The application did not respond" i Discord
    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();

    if (sub === 'start') {
      const prize = interaction.options.getString('prize');
      const gid = genId();

      const embed = new EmbedBuilder()
        .setTitle('Giveaway')
        .setDescription(`**${prize}**\nTrykk på knappen for å delta!`)
        .setFooter({ text: `Giveaway ID: ${gid} • Startet av ${interaction.user.tag}` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`giveaway_join:${gid}`).setLabel('Delta').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`giveaway_end:${gid}`).setLabel('Avslutt (eier/staff)').setStyle(ButtonStyle.Danger)
      );

      // Permission check: kan bot sende i denne kanalen?
      const channel = interaction.channel;
      const perms = channel.permissionsFor ? channel.permissionsFor(interaction.client.user) : null;
      if (!perms || !perms.has(PermissionFlagsBits.ViewChannel) || !perms.has(PermissionFlagsBits.SendMessages)) {
        return interaction.editReply({ content: 'Bot mangler View/Send permissions i denne kanalen. Gi boten tilgang og prøv igjen.' });
      }

      let msg;
      try {
        msg = await channel.send({ embeds: [embed], components: [row] });
      } catch (err) {
        console.error('Kunne ikke poste giveaway-melding:', err);
        return interaction.editReply({ content: 'Kunne ikke poste giveaway-meldingen i kanalen (sjekk rettigheter).' });
      }

      // Persist
      try {
        giveawayStore.set(gid, {
          id: gid,
          messageId: msg.id,
          channelId: msg.channel.id,
          prize,
          ownerId: interaction.user.id,
          participants: []
        });
      } catch (e) {
        console.error('Kunne ikke lagre giveaway:', e);
        return interaction.editReply({ content: 'Giveaway startet, men kunne ikke lagre metadata.' });
      }

      await interaction.editReply({ content: `Giveaway startet med ID **${gid}**.` });
      return;
    }

    if (sub === 'end') {
      const gid = interaction.options.getString('id');
      const g = giveawayStore.get(gid);
      if (!g) return interaction.editReply({ content: 'Fant ikke giveaway med den IDen.' });

      // Permission: owner or staff or ManageGuild
      const isStaff = (config.STAFF_ROLE_ID && interaction.member.roles?.cache.has(config.STAFF_ROLE_ID));
      const hasPerm = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) || isStaff || interaction.user.id === g.ownerId;
      if (!hasPerm) return interaction.editReply({ content: 'Du har ikke rettigheter til å avslutte denne giveawayen.' });

      const participants = g.participants || [];
      if (!participants.length) {
        return interaction.editReply({ content: 'Ingen deltakere i denne giveawayen.' });
      }

      const winnerId = participants[Math.floor(Math.random()*participants.length)];
      giveawayStore.del(gid);

      const channel = await interaction.client.channels.fetch(g.channelId).catch(() => null);
      const winnerMention = `<@${winnerId}>`;
      const announce = `🎉 **Giveaway avsluttet!** 🎉\nVinner av **${g.prize}**: ${winnerMention}`;
      if (channel && channel.isTextBased()) await channel.send({ content: announce });

      // Log to mod logs
      try {
        const logChannel = await interaction.client.channels.fetch(config.MOD_LOGS_CHANNEL_ID).catch(() => null);
        if (logChannel && logChannel.isTextBased()) {
          await logChannel.send({ content: `Giveaway ${gid} avsluttet av ${interaction.user.tag}. Vinner: ${winnerMention}. Premie: ${g.prize}` });
        }
      } catch (_) {}

      await interaction.editReply({ content: `Vinner valgt: ${winnerMention}` });
      return;
    }
  },

  register(builder) {
    builder
      .setName('giveaway')
      .setDescription('Start eller avslutt en giveaway')
      .addSubcommand(sc => sc.setName('start').setDescription('Start en giveaway').addStringOption(o => o.setName('prize').setDescription('Premie').setRequired(true)))
      .addSubcommand(sc => sc.setName('end').setDescription('Avslutt en giveaway og velg vinner').addStringOption(o => o.setName('id').setDescription('Giveaway ID').setRequired(true)));
  }
};
