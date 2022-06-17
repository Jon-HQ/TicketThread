const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const antiCrash = require('./antiCrash');
const fs = require('fs');
require('dotenv/config');

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS],
});

client.on('ready', async () => {
  console.log('Bot > Your bot is ready.');
  antiCrash();

  const commands = await client.application.commands.fetch();
  if (!commands.find((c) => c.name === 'ticket')) {
    client.application?.commands
      .create({ 
        name: 'ticket', 
        description: 'Sends the ticket panel',
        options: [{ type: 'STRING', name: 'message', description: 'The panel message', required: true }], 
      })
      .then((c) => console.log('Added command "' + c.name + '"'))
      .catch((err) => console.log(err));
  }
  if (!commands.find((c) => c.name === 'ticketroles')) {
    client.application?.commands
      .create({
        name: 'ticketroles',
        description: 'Sets the role(s) that has access to the tickets.',
        options: [{ type: 'STRING', name: 'roles', description: 'The role(s) you want to use. Seperate role IDs with commas and no spaces (overwrites old roles)', required: true }],
      })
      .then((c) => console.log(`Added command "${c.name}"`))
      .catch((err) => console.log(err));
  }
});

client.on('interactionCreate', (interaction) => {
  if (interaction.isButton()) {
    const file = JSON.parse(fs.readFileSync('config.json', 'utf8'));
    if (interaction.customId === 'create_ticket') {
      if (interaction.guild.premiumTier === 'NONE' || interaction.guild.premiumTier === 'TIER_1') {
        return interaction.reply({ content: 'You need at least server boost **level 2** to use this feature.', ephemeral: true });
      }

      const openCheck = interaction.channel.threads.cache.find((t) => t.name === interaction.user.username);
      if (!openCheck || openCheck.archived) {
        interaction.channel.threads
          .create({
            name: interaction.user.username,
            autoArchiveDuration: 60,
            type: 'GUILD_PRIVATE_THREAD',
            reason: `Created a ticket for user ${interaction.user.username}`,
          })
          .then((ticket) => {
            ticket.members.add(interaction.user);
            file[interaction.guildId].roles.forEach(async (roleID) => {
              const members = await interaction.guild.members.fetch();
              const filtered = members.filter((m) => m.roles.cache.has(roleID));
              filtered.each((m) => ticket.members.add(m.user));
            });
            interaction.reply({ content: `Created a ticket for you <#${ticket.id}>`, ephemeral: true });
          });
      } else {
        interaction.reply({
          content: `You already have a ticket <#${
            interaction.channel.threads.cache.find((t) => t.name === interaction.user.username)?.id
          }>`,
          ephemeral: true,
        });
      }
    }
  }

  if (interaction.isCommand()) {
    const file = JSON.parse(fs.readFileSync('config.json', 'utf8'));

    if (interaction.commandName === 'ticket') {
      if (!interaction.member.permissions.has('ADMINISTRATOR')) {
        return interaction.reply({ content: 'You need to have the admin permission to use this.', ephemeral: true });
      }

      if (!file[interaction.guildId]) {
        return interaction.reply({
          content: 'No roles set. Please use /ticketroles <roleIDs>. (seperate each id with a comma)',
          ephemeral: true,
        });
      }

      const message = interaction.options.getString('message')
      const embed = new MessageEmbed().setColor('#303037').setDescription(`${message}`);
      const row = new MessageActionRow().addComponents(
        new MessageButton().setCustomId('create_ticket').setLabel('📩').setStyle('SECONDARY')
      );

      interaction.channel.send({ embeds: [embed], components: [row] });
      interaction.reply({ content: '\u200B' });
      interaction.deleteReply();
    } else if (interaction.commandName === 'ticketroles') {
      if (!interaction.member.permissions.has('ADMINISTRATOR')) {
        return interaction.reply({ content: 'You need to have the admin permission to use this.', ephemeral: true });
      }

      try {
        const roles = interaction.options.getString('roles').replaceAll(' ', '').split(',');
        file[interaction.guildId] = { roles: roles };

        fs.writeFile('config.json', JSON.stringify(file), (err) => {
          if (err) console.error(err);
        });

        interaction.reply({ content: `Set required roles to see tickets to **${roles.map((r) => ` <@&${r}>`)}**.`, ephemeral: true });
      } catch (err) {
        console.log(err);
      }
    }
  }
});

client.login(process.env.TOKEN);