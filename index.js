// ✅ index.js with /complete and cooldown logic

import 'dotenv/config';
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const QUEST_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

const errorEmbed = (desc) => new EmbedBuilder().setTitle('❌ Error').setDescription(desc).setColor('Red').setTimestamp();
const successEmbed = (title, desc) => new EmbedBuilder().setTitle(title).setDescription(desc).setColor('Green').setTimestamp();

client.once('ready', () => console.log(`✅ Logged in as ${client.user.tag}`));

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName, guildId, user } = interaction;

  try {
    if (commandName === 'getquest') {
      const { data: existing, error: findErr } = await supabase
        .from('user_quests')
        .select('*')
        .eq('user_id', user.id)
        .eq('server_id', guildId)
        .single();

      if (existing && Date.now() - new Date(existing.assigned_at).getTime() < QUEST_COOLDOWN_MS) {
        const hours = Math.ceil((QUEST_COOLDOWN_MS - (Date.now() - new Date(existing.assigned_at))) / 3600000);
        return interaction.reply({ embeds: [errorEmbed(`You already have a quest. Come back in ${hours} hour(s).`)], ephemeral: true });
      }

      const { data: quests, error } = await supabase
  .from('quests')
  .select('id, quest_name, quest_description, quest_xp')
  .order('random()')
  .limit(1)
  .single();

      if (error || !quests) return interaction.reply({ embeds: [errorEmbed('Could not load quests.')], ephemeral: true });

      await supabase.from('user_quests').upsert({
        user_id: user.id,
        quest_id: quests.id,
        assigned_at: new Date().toISOString(),
        reward_xp: parseInt(quests.quest_xp) || 0,
        server_id: guildId
      });

      const embed = new EmbedBuilder()
        .setTitle(`🎯 Your Quest: ${quests.quest_name}`)
        .setDescription(quests.quest_description || 'No description')
        .addFields({ name: 'XP Reward', value: `${quests.quest_xp} XP` })
        .setColor('Blue')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } else if (commandName === 'complete') {
      const { data: active, error } = await supabase
        .from('user_quests')
        .select('*')
        .eq('user_id', user.id)
        .eq('server_id', guildId)
        .single();

      if (!active) return interaction.reply({ embeds: [errorEmbed('No active quest.')], ephemeral: true });

      // Add XP to user_xp
      const xpToAdd = active.reward_xp;
      const { data: existing } = await supabase
        .from('user_xp')
        .select('xp')
        .eq('user_id', user.id)
        .eq('server_id', guildId)
        .single();

      const newXP = (existing?.xp || 0) + xpToAdd;

      await supabase.from('user_xp').upsert({
        user_id: user.id,
        server_id: guildId,
        xp: newXP
      });

      await supabase.from('user_quests')
        .delete()
        .eq('user_id', user.id)
        .eq('server_id', guildId);

      await interaction.reply({ embeds: [successEmbed('✅ Quest Completed', `You earned ${xpToAdd} XP!`)], ephemeral: true });

    } else if (commandName === 'addquest') {
      const name = interaction.options.getString('name');
      const description = interaction.options.getString('description');
      const xp = interaction.options.getInteger('xp');

      if (!name || !description || xp == null) return interaction.reply({ embeds: [errorEmbed('All fields required.')], ephemeral: true });

      await supabase.from('quests').insert({
        quest_name: name,
        quest_description: description,
        quest_xp: xp.toString(),
        server_id: guildId
      });

      await interaction.reply({ embeds: [successEmbed('✅ Quest Added', name)], ephemeral: true });

    } else if (commandName === 'addbadgerole') {
      const roleName = interaction.options.getString('role_name');
      const requiredXp = interaction.options.getInteger('required_xp');

      if (!roleName || requiredXp == null) return interaction.reply({ embeds: [errorEmbed('Missing role name or XP.')], ephemeral: true });

      await supabase.from('badge_roles').insert({
        role_name: roleName,
        required_xp: requiredXp,
        server_id: guildId
      });

      await interaction.reply({ embeds: [successEmbed('🏅 Badge Role Added', `${roleName} for ${requiredXp} XP`)], ephemeral: true });

    } else {
      await interaction.reply({ embeds: [errorEmbed('Unknown command.')], ephemeral: true });
    }
  } catch (err) {
    console.error(err);
    await interaction.reply({ embeds: [errorEmbed('Unexpected error.')], ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);
