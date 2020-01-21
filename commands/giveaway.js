const giveaways = require("discord-giveaways");
const ms = require("ms"); // npm install ms
const Discord = require("discord.js");
const client = new Discord.Client();
var color = Math.floor(Math.random() * 16777214) + 1;
const moment = require('moment')
const mysql = require("mysql");



module.exports = {
  name: "giveaway",
  description: "Giveaway something.",
  args:true,
  usage: "<time> <winners> <items>",
  execute(message, args, pool) {
    
    var millisec = ms(args[1]);
    
    var id;
    var guild = message.guild;
    pool.getConnection(function(err, con) {
      con.query("INSERT INTO giveaways VALUES (" + id + ", " + guild.id + ", " + message.channel.id + ", " + args.slice(4).join(" ") + ", " + args[2] + ", ")
    })
    
  }
}