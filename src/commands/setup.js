import ensureTicketMessage from '../utils/ticketMessage.js';
import config from '../config.js';

export default {
  async execute(interaction) {
    const guild = interaction.guild;
    const client = interaction.client;
    const results = [];

    // Ticket-kanal: slett gamle bot-meldinger som ser ut som ticket-meldinger
    const ticketChannel = await guild.channels.fetch(config.TICKET_CHANNEL_ID).catch(() => null);
    if (ticketChannel && ticketChannel.isTextBased()) {
      const msgs = await ticketChannel.messages.fetch({ limit: 100 }).catch(() => null);
      let deleted = 0;
      if (msgs) {
        const toDelete = msgs.filter(m => m.author?.id === client.user.id && (m.content?.includes('Åpne ticket') || (m.content && m.content.toLowerCase().includes('trenger du hjelp'))));
        for (const m of toDelete.values()) {
          await m.delete().catch(() => {});
          deleted++;
        }
      }
      results.push(`Slettet ${deleted} gamle ticket-meldinger.`);
      await ensureTicketMessage(client);
      results.push('Opprettet/fastsatte ticket-melding.');
    } else {
      results.push('Fant ikke ticket-kanal.');
    }

    // Velkomst-kanal: slett gamle velkomstmeldinger fra bot og opprett en informasjonsmelding
    const welcomeChannel = await guild.channels.fetch(config.WELCOME_CHANNEL_ID).catch(() => null);
    if (welcomeChannel && welcomeChannel.isTextBased()) {
      const msgs = await welcomeChannel.messages.fetch({ limit: 100 }).catch(() => null);
      let deleted = 0;
      if (msgs) {
        const toDelete = msgs.filter(m => m.author?.id === client.user.id && ((m.content && m.content.toLowerCase().includes('velkommen')) || m.embeds?.some(e => (e.title && e.title.toLowerCase().includes('velkommen')))));
        for (const m of toDelete.values()) {
          await m.delete().catch(() => {});
          deleted++;
        }
      }
      results.push(`Slettet ${deleted} gamle velkomst-meldinger.`);

      const infoMsg = await welcomeChannel.send({ content: '**Velkommen!** — Nye medlemmer vil bli ønsket velkommen her.' }).catch(() => null);
      if (infoMsg) {
        try { await infoMsg.pin(); } catch (e) {}
        results.push('Opprettet velkomst-informasjonsmelding.');
      }
    } else {
      results.push('Fant ikke velkomst-kanal.');
    }

    await interaction.editReply({ content: results.join('\n') });
  }
};
