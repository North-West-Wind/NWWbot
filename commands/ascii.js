const anser = require("anser");
const figlet = require("figlet");
const asciify = require('asciify-image');
const isImageUrl = require('is-image-url');
const { createCanvas } = require("canvas");
const Discord = require("discord.js");
const { Readable } = require('stream');
module.exports = {
    name: "ascii",
    description: "Generate ASCII arts from text or image.",
    usage: "<subcommand> <text | (image attachment)>",
    subcomamnds: ["text", "image"],
    async execute(message, args) {
        if(!args[0]) return message.channel.send(`Please provide a subcommand!\nUsage: \`${message.client.prefix}${this.name} ${this.usage}\`\nAvailable Subcommands: \`${this.subcomamnds.join(", ")}\``);
        switch(args[0].toLowerCase()) {
            case "text":
                if(!args[1]) return message.channel.send("You didn't provide any text! If you want to convert an image, use the `image` subcommand.");
                var text = figlet.textSync(args.slice(1).join(" "));
                var attachment = new Discord.MessageAttachment(Readable.from(text), `${args.slice(1).join(" ")}.txt`);
                if(text.length + 83 > 2000) return message.channel.send("The text is too long to send in Discord! Therefore, I've made it into a file!", attachment);
                message.channel.send("```" + text + "```\nYour text might not show properly! Therefore, here is a text file for you!", attachment);
            break;
            case "image":
                if(message.attachments.size < 1) return message.channel.send("You didn't provide any image! If you want to convert text, use the `text` subcommand.");
                message.attachments.forEach(async attachment => {
                    if(!isImageUrl(attachment.url)) return message.channel.send("The attachment is not an image!");
                    var options = {
                        fit:    'box',
                        width:  Math.round(attachment.width / (10 * 0.42)),
                        height: Math.round(attachment.height / 10)
                    }
                    var msg = await message.channel.send("Image received! Processing ASCII art... (Note: The quality of the generated art depends on the resolution of the image!)");
                    try {
                        var asciis = await asciify(attachment.url, options);
                        var lines = asciis.split("\n");
                        var height = lines.length * 18;
                        var tempCanvas = createCanvas(420, 69);
                        var tempCtx = tempCanvas.getContext("2d");
                        tempCtx.font = "14px Courier New";
                        var width = tempCtx.measureText(anser.ansiToText(lines[0])).width;

                        var canvas = createCanvas(width, height);
                        var ctx = canvas.getContext("2d");
                        ctx.font = "15px Courier New";
                        ctx.textBaseline = "top";
                        ctx.textAlign = "left";
                        ctx.fillStyle = 'dimgray';
                        ctx.fillRect(0, 0, width, height);
                        var num = 0;
                        for(const line of lines) {
                            var words = anser.ansiToJson(line);
                            words = words.filter(x => x.content.length > 0);
                            for(let i = 0; i < words.length; i++) {
                                ctx.fillStyle = 'white';
                                if(words[i].fg) ctx.fillStyle = `rgb(${words[i].fg})`;
                                ctx.fillText(words[i].content, i * width / anser.ansiToText(line).length, num * 18);
                            }
                            num++;
                        }
                        var nameArr = attachment.name.split(".");
                        nameArr.splice(-1, 1);
                        var newattachment = new Discord.MessageAttachment(canvas.toBuffer(), `${nameArr.join(".")}.png`);
                        msg.delete();
                        message.channel.send(newattachment);
                    } catch(err) {
                        return msg.edit(`<@${message.author.id}>, there was an error trying to convert the image into ASCII!`);
                    }
                });
                break;
            default:
                return message.channel.send(`That is not a valid subcommand! Subcommands: \`${this.subcomamnds.join(", ")}\``)
        }
    }
}