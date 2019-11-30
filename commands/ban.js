module.exports = {
	name: 'ban',
    description: 'Ban someone',
    args: true,
    usage: '<user> [reason]',
	execute(message, args) {
    if (!message.member.hasPermission('BAN_MEMBERS')) { 
      message.channel.send(`You don\'t have the permission to use this command.`)
      return;
    }
		// Let's pretend you mentioned the user you want to add a role to (!addrole @user Role Name):
    
    if (!message.guild) return;

    // Assuming we mention someone in the message, this will return the user
    // Read more about mentions over at https://discord.js.org/#/docs/main/master/class/MessageMentions
    const user = message.mentions.users.first();
    // If we have a user mentioned
    if (user) {
      // Now we get the member from the user
      const member = message.guild.member(user);
      // If the member is in the guild
      if (member) {
        /**
         * Ban the member
         * Make sure you run this on a member, not a user!
         * There are big differences between a user and a member
         * Read more about what ban options there are over at
         * https://discord.js.org/#/docs/main/master/class/GuildMember?scrollTo=ban
         */
        member.ban(`${args[1]}`).then(() => {
          // We let the message author know we were able to ban the person
          message.reply(`banned ${user.tag}`);
        }).catch(err => {
          // An error happened
          // This is generally due to the bot not being able to ban the member,
          // either due to missing permissions or role hierarchy
          message.reply('I failed to ban the member');
          // Log the error
          console.error(err);
        });
      } else {
        // The mentioned user isn't in this guild
        message.reply('that user doesn\'t exist!');
      }
    } else {
    // Otherwise, if no user was mentioned
      message.reply('you should tell me who is bad.');
    }
	}
};