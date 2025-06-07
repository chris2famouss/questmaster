// register-commands.js
import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';

const commands = [
  new SlashCommandBuilder()
    .setName('getquest')
    .setDescription('Get a new quest'),

  new SlashCommandBuilder()
    .setName('complete')
    .setDescription('Complete your current quest'),

  new SlashCommandBuilder()
    .setName('addquest')
    .setDescription('Add a new quest')
    .addStringOption(opt => opt.setName('name').setDescription('Quest name').setRequired(true))
    .addStringOption(opt => opt.setName('description').setDescription('Quest description').setRequired(true))
    .addIntegerOption(opt => opt.setName('xp').setDescription('XP reward').setRequired(true)),

  new SlashCommandBuilder()
    .setName('addbadgerole')
    .setDescription('Add a badge role')
    .addStringOption(opt => opt.setName('role_name').setDescription('Role name').setRequired(true))
    .addIntegerOption(opt => opt.setName('required_xp').setDescription('XP required').setRequired(true))
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
await rest.put(
  Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
  { body: commands }
);
console.log('✅ Slash commands registered.');
