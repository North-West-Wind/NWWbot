const Discord = require("discord.js");

module.exports = {
    name: "sike",
    description: "Sends you a video that you will find interesting.",
    category: 3,
    execute(message) {
        message.channel.send(new Discord.MessageAttachment("https://drive.google.com/uc?export=download&id=1FB3uTqJXt8r_WQrU8UU4_g1WbUm6S6xT", "sike.mp4")).then(msg => setTimeout(() => msg.channel.send("In case you didn't notice, please take a look at the duration of the video."), 10000));
    }
}