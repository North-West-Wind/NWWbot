var color = Math.floor(Math.random() * 16777214) + 1;
const { findUser } = require("../function.js");
const { prefix } = require("../config.json");

module.exports = {
	name: 'greet',
	description: 'Greet somebody.',
  usage: "<user | user ID>",
	async execute(message, args) {
		if (!args[0]) {
            return message.channel.send('Who am I greeting?' + ` Usage: \`${prefix}${this.name} ${this.usage}\``);
        }
    

        // grab the "first" mentioned user from the message
        // this will return a `User` object, just like `message.author`
        const taggedUser = await findUser(message, args[0]);
    if(!taggedUser) return;
    message.channel.send("Hello there, **" + taggedUser.tag + "**!");
	},
};