import { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import config from '../config.js';

export default async function ensureTicketMessage(client) {
  const channel = await client.channels.fetch(config.TICKET_CHANNEL_ID).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  const me = client.user;
  const perms = channel.permissionsFor ? channel.permissionsFor(me) : null;
  if (!perms || !perms.has(PermissionFlagsBits.ViewChannel) || !perms.has(PermissionFlagsBits.SendMessages)) {
    console.warn(`Bot mangler tilgang til å sende meldinger i ticket-kanal ${config.TICKET_CHANNEL_ID}. Sjekk at boten er i guilden og har View/Send permissions.`);
    return;
  }

  // Check pinned messages for an existing ticket message (use fetchPins instead of deprecated fetchPinned)
  const pinned = await channel.messages.fetchPins().catch(() => null);
  if (pinned && pinned.size) {
    // If any pinned message by bot contains "Åpne ticket" assume it's present
    if (pinned.some(m => m.author?.id === me.id && m.content?.includes('Åpne ticket'))) return;
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('open_ticket').setLabel('Åpne ticket').setStyle(ButtonStyle.Success)
  );

  let msg;
  try {
    msg = await channel.send({ content: '**Trenger du hjelp?** — trykk på knappen for å åpne en ticket.', components: [row] });
  } catch (err) {
    console.error('Kunne ikke sende ticket-melding i kanal', config.TICKET_CHANNEL_ID, err?.message ?? err);
    return;
  }

  // Pin only if bot has ManageMessages permission
  if (perms.has(PermissionFlagsBits.ManageMessages)) {
    try { await msg.pin(); } catch (e) { console.warn('Kunne ikke pinne ticket-melding:', e?.message ?? e); }
  } else {
    console.warn('Bot mangler ManageMessages i ticket-kanal; pinning hoppet over.');
  }
}
