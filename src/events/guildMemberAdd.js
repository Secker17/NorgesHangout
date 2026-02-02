import config from '../config.js';
import { EmbedBuilder } from 'discord.js';

export default function (client) {
  client.on('guildMemberAdd', async (member) => {
    try {
      const channel = await member.guild.channels.fetch(config.WELCOME_CHANNEL_ID).catch(() => null);
      if (!channel || !channel.isTextBased()) {
        // Fallback: send DM to member
        try { await member.send(`Velkommen til **Norges Hangout**, ${member.user.username}! Vi håper du får en fin tid her.`); } catch (_) {}
        return;
      }

      const perms = channel.permissionsFor ? channel.permissionsFor(client.user) : null;
      if (!perms || !perms.has('ViewChannel') || !perms.has('SendMessages')) {
        // Fallback: send DM to member
        try { await member.send(`Velkommen til **Norges Hangout**, ${member.user.username}! Vi håper du får en fin tid her.`); } catch (_) {}
        console.warn(`Bot mangler Send/View i velkomst-kanal ${config.WELCOME_CHANNEL_ID}; sendt DM til ${member.user.tag} i stedet.`);
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('Velkommen! 🇳🇴')
        .setDescription(`Velkommen til **Norges Hangout**, ${member}! Vi håper du får en fin tid her.`)
        .setColor(0x00FF7F)
        .setTimestamp();

      await channel.send({ content: `${member}`, embeds: [embed] });
    } catch (err) {
      console.error('Kunne ikke sende velkomstmelding:', err);
    }
  });
}
