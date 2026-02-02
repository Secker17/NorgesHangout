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

    // Register /setup command in guild (quick, guild-scoped)
    const guildId = process.env.GUILD_ID ?? config.GUILD_ID;
    if (guildId) {
      try {
        const guild = await client.guilds.fetch(guildId);
        const existing = await guild.commands.fetch();
        if (!existing.some(c => c.name === 'setup')) {
          await guild.commands.create({
            name: 'setup',
            description: 'Sett opp ticket- og velkomstmeldinger (sletter gamle duplikater)',
            defaultMemberPermissions: PermissionFlagsBits.ManageGuild.toString()
          });
          console.log('Setup-kommando registrert for guild', guildId);
        }
      } catch (e) {
        console.error('Kunne ikke registrere /setup-kommando:', e);
      }
    } else {
      console.warn('GUILD_ID ikke satt; /setup ble ikke registrert.');
    }
  });
}
