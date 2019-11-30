module.exports = {
	name: 'greet',
	description: 'Tag a member and greet them (but not really).',
	execute(message) {
		if (!message.mentions.users.size) {
            return message.channel.send('Who am I greeting?');
        }

        // grab the "first" mentioned user from the message
        // this will return a `User` object, just like `message.author`
        const taggedUser = message.mentions.users.first();
    
        message.channel.send(`Greetings, ${taggedUser}`);
	},
};