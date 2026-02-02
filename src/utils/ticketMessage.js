import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import config from '../config.js';

export default async function ensureTicketMessage(client) {
  const channel = await client.channels.fetch(config.TICKET_CHANNEL_ID).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  // Check pinned messages for an existing ticket message
  const pinned = await channel.messages.fetchPinned().catch(() => null);
  if (pinned && pinned.size) {
    // If any pinned message by bot contains "Åpne ticket" assume it's present
    if (pinned.some(m => m.author?.id === client.user.id && m.content?.includes('Åpne ticket'))) return;
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('open_ticket').setLabel('Åpne ticket').setStyle(ButtonStyle.Success)
  );

  const msg = await channel.send({ content: '**Trenger du hjelp?** — trykk på knappen for å åpne en ticket.', components: [row] });
  try { await msg.pin(); } catch (e) { /* ignore pin errors */ }
}
