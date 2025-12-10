import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { loadData, saveData } from '../utils/storage';

export const data = new SlashCommandBuilder()
  .setName('secretsanta')
  .setDescription('Manage Secret Santa events')
  .addSubcommand(subcommand =>
    subcommand
      .setName('create')
      .setDescription('Create a new Secret Santa event')
      .addStringOption(option =>
        option
          .setName('name')
          .setDescription('Name of the Secret Santa event')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('join')
      .setDescription('Join the Secret Santa event')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('leave')
      .setDescription('Leave the Secret Santa event')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('start')
      .setDescription('Start the Secret Santa and assign matches (organizer only)')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('status')
      .setDescription('View the current Secret Santa event status')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('cancel')
      .setDescription('Cancel the current Secret Santa event (organizer only)')
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'create':
      await handleCreate(interaction);
      break;
    case 'join':
      await handleJoin(interaction);
      break;
    case 'leave':
      await handleLeave(interaction);
      break;
    case 'start':
      await handleStart(interaction);
      break;
    case 'status':
      await handleStatus(interaction);
      break;
    case 'cancel':
      await handleCancel(interaction);
      break;
  }
}

async function handleCreate(interaction: ChatInputCommandInteraction) {
  const eventName = interaction.options.getString('name', true);
  const guildId = interaction.guildId!;
  const data = loadData();

  if (data[guildId]?.active) {
    await interaction.reply({
      content: '❌ There is already an active Secret Santa event in this server. Cancel it first with `/secretsanta cancel`',
      ephemeral: true
    });
    return;
  }

  data[guildId] = {
    name: eventName,
    organizer: interaction.user.id,
    participants: [],
    matches: {},
    active: true,
    started: false
  };

  saveData(data);

  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('🎅 Secret Santa Event Created!')
    .setDescription(`**${eventName}** has been created!`)
    .addFields(
      { name: 'Organizer', value: `<@${interaction.user.id}>`, inline: true },
      { name: 'Participants', value: '0', inline: true }
    )
    .setFooter({ text: 'Use /secretsanta join to participate!' });

  await interaction.reply({ embeds: [embed] });
}

async function handleJoin(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  const userId = interaction.user.id;
  const data = loadData();

  if (!data[guildId]?.active) {
    await interaction.reply({
      content: '❌ There is no active Secret Santa event in this server.',
      ephemeral: true
    });
    return;
  }

  if (data[guildId].started) {
    await interaction.reply({
      content: '❌ This Secret Santa event has already started. You cannot join now.',
      ephemeral: true
    });
    return;
  }

  if (data[guildId].participants.includes(userId)) {
    await interaction.reply({
      content: '❌ You are already participating in this Secret Santa event!',
      ephemeral: true
    });
    return;
  }

  data[guildId].participants.push(userId);
  saveData(data);

  await interaction.reply({
    content: `✅ You have joined **${data[guildId].name}**! Current participants: ${data[guildId].participants.length}`,
    ephemeral: true
  });
}

async function handleLeave(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  const userId = interaction.user.id;
  const data = loadData();

  if (!data[guildId]?.active) {
    await interaction.reply({
      content: '❌ There is no active Secret Santa event in this server.',
      ephemeral: true
    });
    return;
  }

  if (data[guildId].started) {
    await interaction.reply({
      content: '❌ This Secret Santa event has already started. You cannot leave now.',
      ephemeral: true
    });
    return;
  }

  const index = data[guildId].participants.indexOf(userId);
  if (index === -1) {
    await interaction.reply({
      content: '❌ You are not participating in this Secret Santa event.',
      ephemeral: true
    });
    return;
  }

  data[guildId].participants.splice(index, 1);
  saveData(data);

  await interaction.reply({
    content: `✅ You have left **${data[guildId].name}**. Participants remaining: ${data[guildId].participants.length}`,
    ephemeral: true
  });
}

async function handleStart(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  const userId = interaction.user.id;
  const data = loadData();

  if (!data[guildId]?.active) {
    await interaction.reply({
      content: '❌ There is no active Secret Santa event in this server.',
      ephemeral: true
    });
    return;
  }

  if (data[guildId].organizer !== userId) {
    await interaction.reply({
      content: '❌ Only the event organizer can start the Secret Santa!',
      ephemeral: true
    });
    return;
  }

  if (data[guildId].started) {
    await interaction.reply({
      content: '❌ This Secret Santa event has already been started!',
      ephemeral: true
    });
    return;
  }

  const participants = data[guildId].participants;

  if (participants.length < 3) {
    await interaction.reply({
      content: '❌ You need at least 3 participants to start a Secret Santa event!',
      ephemeral: true
    });
    return;
  }

  // Defer reply as DM sending might take time
  await interaction.deferReply();

  // Generate matches using derangement algorithm
  const { assignMatches } = await import('../utils/matching');
  const matches = assignMatches(participants);

  data[guildId].matches = matches;
  data[guildId].started = true;
  saveData(data);

  // Send DMs to all participants
  let successCount = 0;
  let failCount = 0;

  for (const [giverId, receiverId] of Object.entries(matches)) {
    try {
      const user = await interaction.client.users.fetch(giverId);
      const receiver = await interaction.client.users.fetch(receiverId);

      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle(`🎁 ${data[guildId].name}`)
        .setDescription(`## You have to gift:\n# ${receiver.username}\n\n🤫 Keep this a secret! Don't tell anyone who you got.`)
        .setFooter({ text: `Event: ${data[guildId].name}` });

      await user.send({ embeds: [embed] });
      successCount++;
    } catch (error) {
      console.error(`Failed to send DM to user ${giverId}:`, error);
      failCount++;
    }
  }

  const resultEmbed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('🎅 Secret Santa Started!')
    .setDescription(`**${data[guildId].name}** has been started!`)
    .addFields(
      { name: '✅ DMs Sent', value: successCount.toString(), inline: true },
      { name: '❌ DMs Failed', value: failCount.toString(), inline: true },
      { name: 'Total Participants', value: participants.length.toString(), inline: true }
    )
    .setFooter({ text: failCount > 0 ? 'Some users may have DMs disabled.' : 'All matches assigned!' });

  await interaction.editReply({ embeds: [resultEmbed] });
}

async function handleStatus(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  const data = loadData();

  if (!data[guildId]?.active) {
    await interaction.reply({
      content: '❌ There is no active Secret Santa event in this server.',
      ephemeral: true
    });
    return;
  }

  const event = data[guildId];
  const participantList = event.participants.map(id => `<@${id}>`).join('\n') || 'No participants yet';

  const embed = new EmbedBuilder()
    .setColor(event.started ? 0xFF0000 : 0xFFFF00)
    .setTitle(`🎅 ${event.name}`)
    .addFields(
      { name: 'Status', value: event.started ? '🎁 Started' : '⏳ Open for joining', inline: true },
      { name: 'Organizer', value: `<@${event.organizer}>`, inline: true },
      { name: 'Participants', value: event.participants.length.toString(), inline: true },
      { name: 'Participant List', value: participantList }
    );

  await interaction.reply({ embeds: [embed] });
}

async function handleCancel(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  const userId = interaction.user.id;
  const data = loadData();

  if (!data[guildId]?.active) {
    await interaction.reply({
      content: '❌ There is no active Secret Santa event in this server.',
      ephemeral: true
    });
    return;
  }

  if (data[guildId].organizer !== userId) {
    await interaction.reply({
      content: '❌ Only the event organizer can cancel the Secret Santa!',
      ephemeral: true
    });
    return;
  }

  const eventName = data[guildId].name;
  delete data[guildId];
  saveData(data);

  await interaction.reply({
    content: `✅ **${eventName}** has been cancelled.`
  });
}
