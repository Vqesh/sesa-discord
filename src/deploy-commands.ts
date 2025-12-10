import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import * as secretSanta from './commands/secretsanta';

dotenv.config();

const commands = [secretSanta.data.toJSON()];

const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    const guildId = process.env.GUILD_ID;
    const clientId = process.env.CLIENT_ID;

    if (!clientId) {
      console.error('❌ CLIENT_ID not found in .env file');
      process.exit(1);
    }

    if (guildId) {
      // Register commands to a specific guild (instant, good for testing)
      const data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      ) as any[];

      console.log(`✅ Successfully reloaded ${data.length} guild commands for guild ${guildId}.`);
    } else {
      // Register commands globally (takes up to 1 hour to update)
      const data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      ) as any[];

      console.log(`✅ Successfully reloaded ${data.length} global commands.`);
      console.log('⚠️  Note: Global commands may take up to 1 hour to appear.');
    }
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
  }
})();
