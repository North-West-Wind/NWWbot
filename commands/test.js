const Discord = require("discord.js");
const ms = require("ms");
var color = Math.floor(Math.random() * 16777214) + 1;

const { Image, createCanvas, loadImage } = require("canvas");
var fs = require("fs");

function twoDigits(d) {
  if (0 <= d && d < 10) return "0" + d.toString();
  if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
  return d.toString();
}

module.exports = {
  name: "test",
  description: "For test, really.",
  execute(message, args, pool) {
    const Embed = new Discord.RichEmbed().setDescription(":one:");
    message.channel.send(Embed).then(msg => {
      msg.react("😄");
      msg.react("👌");
      msg.react("😀");
      const filter = (reaction, user) => {
        return (
          ["😄", "👌"].includes(reaction.emoji.name) &&
          user.id === message.author.id
        );
      };

      setTimeout(function() {
        for(const emoji of msg.reactions.values()) {
          console.log((emoji.count - 1));
        }
      }, 10000);
    });
  }
};
