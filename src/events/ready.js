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

    // Register /setup command in guild (guild-scoped if possible). If GUILD_ID is wrong or the bot isn't in that guild,
    // fall back to registering the command in all guilds the bot is connected to (guilds.cache).
    const guildId = process.env.GUILD_ID ?? config.GUILD_ID;
    if (guildId) {
      try {
        let guild;
        try {
          guild = await client.guilds.fetch(guildId);
        } catch (fetchErr) {
          console.warn('Kunne ikke hente guild med GUILD_ID:', guildId, fetchErr.message);
        }

        if (guild) {
          const existing = await guild.commands.fetch();
          if (!existing.some(c => c.name === 'setup')) {
            await guild.commands.create({
              name: 'setup',
              description: 'Sett opp ticket- og velkomstmeldinger (sletter gamle duplikater)',
              defaultMemberPermissions: PermissionFlagsBits.ManageGuild.toString()
            });
            console.log('Setup-kommando registrert for guild', guildId);
          } else {
            console.log('/setup allerede registrert i guild', guildId);
          }
        } else {
          console.warn(`GUILD_ID ${guildId} er ikke tilgjengelig for boten. Forsøker å registrere i alle tilgjengelige guilds...`);
          for (const [id] of client.guilds.cache) {
            try {
              const g = await client.guilds.fetch(id);
              const existing = await g.commands.fetch();
              if (!existing.some(c => c.name === 'setup')) {
                await g.commands.create({
                  name: 'setup',
                  description: 'Sett opp ticket- og velkomstmeldinger (sletter gamle duplikater)',
                  defaultMemberPermissions: PermissionFlagsBits.ManageGuild.toString()
                });
                console.log('Setup-kommando registrert for guild', id);
              }
            } catch (err) {
              console.warn('Kunne ikke registrere /setup i guild', id, err.message);
            }
          }
        }
      } catch (e) {
        console.error('Kunne ikke registrere /setup-kommando:', e);
      }
    } else {
      console.warn('GUILD_ID ikke satt; registrerer /setup i alle guilds i cache...');
      for (const [id] of client.guilds.cache) {
        try {
          const g = await client.guilds.fetch(id);
          const existing = await g.commands.fetch();
          if (!existing.some(c => c.name === 'setup')) {
            await g.commands.create({
              name: 'setup',
              description: 'Sett opp ticket- og velkomstmeldinger (sletter gamle duplikater)',
              defaultMemberPermissions: PermissionFlagsBits.ManageGuild.toString()
            });
            console.log('Setup-kommando registrert for guild', id);
          }
        } catch (err) {
          console.warn('Kunne ikke registrere /setup i guild', id, err.message);
        }
      }
    }
  });
}
