const Discord = require("discord.js");
const { ApplicationCommand, InteractionResponse, InteractionResponseType } = require("../../classes/Slash");
const { wait } = require("../../function");
const attachment = new Discord.MessageAttachment("https://drive.google.com/uc?export=download&id=1FB3uTqJXt8r_WQrU8UU4_g1WbUm6S6xT", "sike.mp4");

module.exports = {
    name: "sike",
    description: "Sends you a video that you will find interesting.",
    category: 3,
    slashInit: true,
    register: () => ApplicationCommand.createBasic(module.exports),
    async slash() {
        return InteractionResponse.ackknowledge();
    },
    async postSlash(client, interaction) {
        const { channel } = await InteractionResponse.createFakeMessage(client, interaction);
        await channel.send(attachment);
        await wait(10000 - 1500);
        await channel.send("In case you didn't notice, please take a look at the duration of the video.");
    },
    execute(message) {
        message.channel.send(attachment).then(msg => setTimeout(() => msg.channel.send("In case you didn't notice, please take a look at the duration of the video."), 10000));
    }
}