import ensureTicketMessage from '../utils/ticketMessage.js';
import config from '../config.js';
import { PermissionFlagsBits } from 'discord.js';

export default function (client) {
  client.once('ready', async () => {
    console.log(`Ready — ${client.user.tag}`);

    try {
      await ensureTicketMessage(client);
      console.log('Ticket message ensured.');
    } catch (err) {
      console.error('Feil ved oppretting av ticket-melding:', err);
    }

    // Register /setup and /giveaway commands in guilds (guild-scoped). Falls back to registering in all guilds in cache.
    const guildId = process.env.GUILD_ID ?? config.GUILD_ID;

    async function registerCommandsForGuild(guild) {
      try {
        const existing = await guild.commands.fetch();
        if (!existing.some(c => c.name === 'setup')) {
          await guild.commands.create({
            name: 'setup',
            description: 'Sett opp ticket- og velkomstmeldinger (sletter gamle duplikater)',
            defaultMemberPermissions: PermissionFlagsBits.ManageGuild.toString()
          });
          console.log('Setup-kommando registrert for guild', guild.id);
        }

        // Register giveaway command (with subcommands)
        if (!existing.some(c => c.name === 'giveaway')) {
          await guild.commands.create({
            name: 'giveaway',
            description: 'Start eller avslutt en giveaway',
            options: [
              {
                name: 'start',
                description: 'Start en giveaway',
                type: 1,
                options: [{ name: 'prize', description: 'Premie', type: 3, required: true }]
              },
              {
                name: 'end',
                description: 'Avslutt en giveaway og velg vinner',
                type: 1,
                options: [{ name: 'id', description: 'Giveaway ID', type: 3, required: true }]
              }
            ]
          });
          console.log('Giveaway-kommando registrert for guild', guild.id);
        }
      } catch (err) {
        console.warn('Kunne ikke registrere kommandoer i guild', guild.id, err.message);
      }
    }

    if (guildId) {
      try {
        let guild;
        try {
          guild = await client.guilds.fetch(guildId);
        } catch (fetchErr) {
          console.warn('Kunne ikke hente guild med GUILD_ID:', guildId, fetchErr.message);
        }

        if (guild) {
          await registerCommandsForGuild(guild);
        } else {
          console.warn(`GUILD_ID ${guildId} er ikke tilgjengelig for boten. Forsøker å registrere i alle tilgjengelige guilds...`);
          for (const [id] of client.guilds.cache) {
            try { const g = await client.guilds.fetch(id); await registerCommandsForGuild(g); } catch (_) {}
          }
        }
      } catch (e) {
        console.error('Kunne ikke registrere kommandoer:', e);
      }
    } else {
      console.warn('GUILD_ID ikke satt; registrerer kommandoer i alle guilds i cache...');
      for (const [id] of client.guilds.cache) {
        try { const g = await client.guilds.fetch(id); await registerCommandsForGuild(g); } catch (_) {}
      }
    }
  });
}
