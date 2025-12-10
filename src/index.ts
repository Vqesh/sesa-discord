import { Client, GatewayIntentBits, Collection, Interaction } from 'discord.js';
import dotenv from 'dotenv';
import * as secretSanta from './commands/secretsanta';

dotenv.config();

// Extend Client type to include commands
interface ExtendedClient extends Client {
  commands: Collection<string, any>;
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
}) as ExtendedClient;

// Set up commands collection
client.commands = new Collection();
client.commands.set(secretSanta.data.name, secretSanta);

client.once('clientReady', () => {
  console.log(`✅ Bot is online as ${client.user?.tag}`);
  console.log(`📝 Loaded ${client.commands.size} command(s)`);
});

// Handle slash commands
client.on('interactionCreate', async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);

    const errorMessage = {
      content: '❌ There was an error executing this command!',
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// Keep the ping command for testing
client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  if (message.content === '!ping') {
    message.reply('Pong! 🎅');
  }
});

const token = process.env.DISCORD_TOKEN;

if (!token) {
  console.error('❌ No DISCORD_TOKEN found in .env file');
  process.exit(1);
}

client.login(token);
