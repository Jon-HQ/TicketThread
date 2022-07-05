const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton, MessageMentions } = require('discord.js');
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
      .create({ name: 'ticket', description: 'Send a button to open a ticket.' })
      .then((c) => console.log('Created command "' + c.name + '"'))
      .catch((err) => console.log(err));
  }

  if (!commands.find((c) => c.name === 'ticketlogs')) {
    client.application?.commands
      .create({
        name: 'ticketlogs',
        description: 'Set the ticket logs channel.',
        options: [
          {
            type: 'CHANNEL',
            name: 'channel',
            description: 'The channel you want to use for ticket logs.',
            channelTypes: ['GUILD_TEXT'],
            required: true,
          },
        ],
      })
      .then((c) => console.log('Created command "' + c.name + '"'))
      .catch((err) => console.log(err));
  }
});

client.on('interactionCreate', async (interaction) => {
  const file = JSON.parse(fs.readFileSync('config.json', 'utf8'));

  if (interaction.isButton()) {
    if (interaction.customId === 'create_ticket') {
      if (interaction.guild.premiumTier === 'NONE' || interaction.guild.premiumTier === 'TIER_1') {
        return interaction.reply({ content: 'You need at least server boost **level 2** to use this feature.', ephemeral: true });
      }

      const openCheck = interaction.channel.threads.cache.find((t) => t.name === interaction.user.username);
      if (!openCheck || openCheck.archived) {
        if (!file[interaction.guildId]) {
          return interaction.reply({ content: 'No ticket logs channel set. Please use /ticketlogs <Text Channel>' });
        }

        interaction.channel.threads
          .create({
            name: interaction.user.username,
            autoArchiveDuration: 1440,
            type: 'GUILD_PRIVATE_THREAD',
            reason: `Created a ticket for user ${interaction.user.username}`,
          })
          .then((ticket) => {
            ticket.members.add(interaction.user);
            interaction.reply({ content: `Created a ticket for you <#${ticket.id}>`, ephemeral: true });

            if (file[interaction.guildId]) {
              const channel = interaction.client.channels.cache.get(file[interaction.guildId].channel);
              const embed = new MessageEmbed().setColor('#303037').setDescription(`${interaction.member} has created a ticket <#${ticket.id}>`);
              const row = new MessageActionRow().addComponents(
                new MessageButton().setCustomId('ticket_take').setLabel('Join Ticket').setStyle('PRIMARY'),
                new MessageButton().setCustomId('ticket_finish').setLabel('Finish Ticket').setStyle('SUCCESS')
              );
              channel ? channel.send({ embeds: [embed], components: [row] }) : null;
            }
          });
      } else {
        const channel = interaction.channel.threads.cache.find((t) => t.name === interaction.user.username);
        return interaction.reply({
          content: `You already have a ticket <#${channel?.id}>`,
          ephemeral: true,
        });
      }
    } else if (interaction.customId === 'ticket_take') {
      const userID = interaction.message.embeds[0].description
       .match(MessageMentions.USERS_PATTERN)
       .at(0)
       .replace('<@', '')
       .replace('!', '')
       .replace('>', '');

      console.log('UserID', userID);
      const member = await interaction.guild.members.fetch(userID);
      console.log('member', member);
      const channel = interaction.guild.channels.cache.find((c) => c.name === member?.user.username && !c.archived);

      if (channel) {
        channel.members.add(interaction.member); // ADD THE MEMBER TO THE THREAD

        interaction.reply({ content: `Added you to the ticket.`, ephemeral: true });
      } else {
        interaction.reply({ content: `Ticket not found. maybe it was archived or deleted?`, ephemeral: true });
      }
    } else if (interaction.customId === 'ticket_finish') {
      const userID = interaction.message.embeds[0].description
       .match(MessageMentions.USERS_PATTERN)
       .at(0)
       .replace('<@', '')
       .replace('!', '')
       .replace('>', '');
       
      console.log('UserID', userID);
      console.log(interaction.channel.messages.cache.first().embeds[0].description.match(MessageMentions.USERS_PATTERN).at(0));
      const member = await interaction.guild.members.fetch(userID);
      console.log('member', member);
      const channel = interaction.guild.channels.cache.find((c) => c.name === member.user.username && !c.archived);

      if (channel && !channel.archived) {
        channel.setLocked(true); // ONLY MEMBERS WITH MANAGE_THREADS CAN UNARCHIVE now
        channel.setArchived(true); // ARCHIVE THE THREAD

        interaction.reply({ content: `Archived the ticket.`, ephemeral: true });
      } else {
        interaction.reply({ content: `Ticket not found. maybe it was archived or deleted?`, ephemeral: true });
      }
    }
  }

  if (interaction.isCommand()) {
    if (interaction.commandName === 'ticket') {
      if (!interaction.member.permissions.has('ADMINISTRATOR')) {
        return interaction.reply({ content: 'You need to have the admin permission to use this.', ephemeral: true });
      }

      const embed = new MessageEmbed().setColor('#303037').setDescription('To open a ticket click the button below');
      const row = new MessageActionRow().addComponents(
        new MessageButton().setCustomId('create_ticket').setLabel('📩').setStyle('SECONDARY')
      );

      interaction.channel.send({ embeds: [embed], components: [row] });
      interaction.reply({ content: '\u200B' });
      interaction.deleteReply();
    } else if (interaction.commandName === 'ticketlogs') {
      if (!interaction.member.permissions.has('ADMINISTRATOR')) {
        return interaction.reply({ content: 'You need to have the admin permission to use this.', ephemeral: true });
      }

      try {
        const channel = interaction.options.getChannel('channel');
        file[interaction.guildId] = { channel: channel.id };

        fs.writeFile('config.json', JSON.stringify(file), (err) => {
          if (err) console.error(err);
        });

        interaction.reply({ content: `Set ticket logs channel to **${channel}**.`, ephemeral: true });
      } catch (err) {
        console.log(err);
      }
    }
  }
});

client.login(process.env.TOKEN);
