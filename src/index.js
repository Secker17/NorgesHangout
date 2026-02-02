import 'dotenv/config';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import fs from 'fs';
import path from 'path';
import config from './config.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// Load event files
const eventsPath = path.join(process.cwd(), 'src', 'events');
if (fs.existsSync(eventsPath)) {
  const files = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const { default: run } = await import(path.join(eventsPath, file));
    run(client);
  }
}

client.login(process.env.BOT_TOKEN);
