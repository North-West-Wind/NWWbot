var color = Math.floor(Math.random() * 16777214) + 1;
const { findUser } = require("../function.js");

module.exports = {
	name: 'greet',
	description: 'Greet somebody.',
  usage: "<user | user ID>",
  category: 3,
  args: 1,
	async execute(message, args) {
    const taggedUser = await findUser(message, args[0]);
    if(!taggedUser) return;
    message.channel.send("Hello there, **" + taggedUser.tag + "**!");
	},
};