import config from '../config.js';
import { EmbedBuilder } from 'discord.js';

export default function (client) {
  client.on('guildMemberAdd', async (member) => {
    try {
      const channel = await member.guild.channels.fetch(config.WELCOME_CHANNEL_ID);
      if (!channel || !channel.isTextBased()) return;

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
