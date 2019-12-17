const http = require('http');
const express = require('express');
const app = express();
app.get("/", (request, response) => {
  console.log(Date.now() + " Ping Received");
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);


const fs = require('fs');
const Discord = require('discord.js');
const { prefix } = require('./config.json');
const ytdl = require('ytdl-core');
const music = new require('./musictest.js');
const giveaways = require("discord-giveaways");
const giveaway = require("./giveaways.js");

const client = new Discord.Client();

client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once('ready', () => {
	console.log('Ready!');
  giveaways.launch(client, {
        updateCountdownEvery: 5000,
        botsCanWin: false,
        ignoreIfHasPermission: [
            "MANAGE_MESSAGES",
            "MANAGE_GUILD",
            "ADMINISTRATOR"
        ],
        embedColor: "#FF0000",
        embedColorEnd: "#000000",
        reaction: "🎉",
        storage: __dirname+"/giveaways.json"
    });
  client.user.setPresence("?help for help!", { type: "LISTENING"});
});
// login to Discord with your app's token
client.login(process.env.TOKEN);


client.on('message', async message => {
    // client.on('message', message => {
if (!message.content.startsWith(prefix) || message.author.bot) return;

const args = message.content.slice(prefix.length).split(/ +/);
const commandName = args.shift().toLowerCase();
  
  if ( music.checkAdminCmd(message) )
        return;
  

  
  
if (commandName.args && !args.length) {
    let reply = `You didn't provide any arguments, ${message.author}!`;

		if (command.usage) {
			reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
		}

		return message.channel.send(reply);
	
    }
    
    const command = client.commands.get(commandName)
    || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    
    if (!command) return;

	try {
		command.execute(message, args);
	} catch (error) {
		console.error(error);
		message.reply('there was an error trying to execute that command!');
	}
  
});