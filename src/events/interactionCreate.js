import { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import config from '../config.js';

export default function (client) {
  client.on('interactionCreate', async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'setup') {
          const hasPerm = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) || (config.STAFF_ROLE_ID && interaction.member.roles?.cache.has(config.STAFF_ROLE_ID));
          if (!hasPerm) return interaction.reply({ content: 'Du har ikke tillatelse til å bruke denne kommandoen.', ephemeral: true });
          await interaction.deferReply({ ephemeral: true });
          try {
            const { default: setup } = await import('../commands/setup.js');
            await setup.execute(interaction);
          } catch (e) {
            console.error('Error executing setup command:', e);
            await interaction.editReply({ content: 'En feil oppstod under setup.' });
          }
          return;
        }
      }

      if (interaction.isButton()) {
        const id = interaction.customId;

        if (id === 'open_ticket') {
          await interaction.deferReply({ ephemeral: true });
          const guild = interaction.guild;
          const member = interaction.member;

          // Create (or find) Tickets category
          let category = guild.channels.cache.find(c => c.type === 4 && c.name.toLowerCase().includes('tickets'));
          if (!category) {
            category = await guild.channels.create({ name: 'Tickets', type: 4 });
          }

          const safeName = `${member.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 12);
          const rnd = Math.floor(Math.random() * 9000) + 1000;
          const channelName = `ticket-${safeName}-${rnd}`;

          const overrides = [
            { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
          ];

          if (config.STAFF_ROLE_ID) overrides.push({ id: config.STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });

          const ticketChannel = await guild.channels.create({
            name: channelName,
            type: 0,
            parent: category.id,
            permissionOverwrites: overrides
          });

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('close_ticket').setLabel('Lås ticket').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('delete_ticket').setLabel('Slett ticket').setStyle(ButtonStyle.Danger)
          );

          await ticketChannel.send({ content: `Hei ${member} — en ticket er opprettet. En staff vil hjelpe deg snart.`, components: [row] });

          await interaction.editReply({ content: `Ticket opprettet: ${ticketChannel}` });
        }

        if (id === 'close_ticket' || id === 'reopen_ticket') {
          if (!interaction.channel) return interaction.reply({ content: 'Dette kan kun brukes i ticket-kanaler.', ephemeral: true });
          const isClosed = interaction.customId === 'reopen_ticket';

          // Toggle by denying SEND_MESSAGES to the ticket owner (lookup from channel topic or messages alternatively)
          const channel = interaction.channel;
          // Find the member by checking permission overwrites (skip robust lookup for brevity)
          const memberOverwrite = channel.permissionOverwrites.cache.find(o => o.type === 'member' && o.allow.has(PermissionFlagsBits.ViewChannel));

          if (memberOverwrite) {
            const targetId = memberOverwrite.id;
            if (!isClosed) {
              await channel.permissionOverwrites.edit(targetId, { SendMessages: false });
              const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('reopen_ticket').setLabel('Gjenåpne ticket').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('delete_ticket').setLabel('Slett ticket').setStyle(ButtonStyle.Danger)
              );
              await channel.send({ content: `Ticket låst av ${interaction.user}.`, components: [row] });
              await interaction.reply({ content: 'Ticket låst.', ephemeral: true });
            } else {
              await channel.permissionOverwrites.edit(targetId, { SendMessages: true });
              const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('close_ticket').setLabel('Lås ticket').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('delete_ticket').setLabel('Slett ticket').setStyle(ButtonStyle.Danger)
              );
              await channel.send({ content: `Ticket gjenåpnet av ${interaction.user}.`, components: [row] });
              await interaction.reply({ content: 'Ticket gjenåpnet.', ephemeral: true });
            }
          } else {
            await interaction.reply({ content: 'Fant ikke ticket-eier. (kan ikke låse)', ephemeral: true });
          }
        }

        if (id === 'delete_ticket') {
          if (!interaction.channel) return interaction.reply({ content: 'Dette kan kun brukes i ticket-kanaler.', ephemeral: true });
          await interaction.reply({ content: 'Sletter ticket om 5 sekunder...', ephemeral: true });
          setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
        }
      }
    } catch (err) {
      console.error('Error handling interaction:', err);
    }
  });
}
