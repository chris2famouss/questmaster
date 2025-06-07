// register-commands.js
import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';

const commands = [
  new SlashCommandBuilder()
    .setName('getquest')
    .setDescription('Get a new quest'),

  new SlashCommandBuilder()
    .setName('addquest')
    .setDescription('Add a new quest to the server')
    .addStringOption(opt =>
      opt.setName('name').setDescription('Quest name').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('description').setDescription('Quest description').setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('xp').setDescription('XP reward for the quest').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('complete')
    .setDescription('Mark a quest as completed')
    .addStringOption(opt =>
      opt.setName('quest_id').setDescription('The ID of the quest you completed').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('addbadgerole')
    .setDescription('Add a new badge role based on XP')
    .addStringOption(opt =>
      opt.setName('role_name').setDescription('Name of the badge role').setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('required_xp').setDescription('XP needed for the badge').setRequired(true)
    ),
]
  .map(command => command.toJSON());

// Load tokens
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

if (!token || !clientId) {
  throw new Error('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in .env');
}

// Register commands globally
const rest = new REST({ version: '10' }).setToken(token);

try {
  console.log('🔄 Refreshing application commands...');

  await rest.put(
    Routes.applicationCommands(clientId),
    { body: commands }
  );

  console.log('✅ Successfully registered global application commands.');
} catch (error) {
  console.error('❌ Failed to register commands:', error);
}
