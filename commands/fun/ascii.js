const anser = require("anser");
const figlet = require("figlet");
const asciify = require('asciify-image');
const isImageUrl = require('is-image-url');
const { createCanvas } = require("canvas");
const Discord = require("discord.js");
const sanitize = require("sanitize-filename");
const { NorthClient } = require("../../classes/NorthClient.js");
module.exports = {
    name: "ascii",
    description: "Generate ASCII arts from text or image.",
    usage: "<subcommand>",
    category: 3,
    subcomamnds: ["text", "image"],
    subdesc: ["Generate ASCII art from text.", "Generate ASCII art from image."],
    subusage: ["<subcommand> <text>", "<subcommand> <attachment>"],
    args: 2,
    async execute(message, args) {
        if (!args[0]) return await message.channel.send(`Please provide a subcommand!\nUsage: \`${message.prefix}${this.name} ${this.usage}\`\nAvailable Subcommands: \`${this.subcomamnds.join(", ")}\``);
        switch (args[0].toLowerCase()) {
            case "text":
                if (!args[1]) return await message.channel.send("You didn't provide any text! If you want to convert an image, use the `image` subcommand.");
                const text = figlet.textSync(args.slice(1).join(" "));
                const attachment = new Discord.MessageAttachment(Buffer.from(text, 'utf8'), sanitize(`${args.slice(1).join(" ")}.txt`));
                if (text.length + 83 > 2000) return await message.channel.send("The text is too long to send in Discord! Therefore, I've made it into a file!", attachment);
                else await message.channel.send("```" + text + "```\nYour text might not show properly! Therefore, here is a text file for you!", attachment);
                break;
            case "image":
                if (message.attachments.size < 1) return await message.channel.send("You didn't provide any image! If you want to convert text, use the `text` subcommand.");
                message.attachments.forEach(async attachment => {
                    if (!isImageUrl(attachment.url)) return await message.channel.send("The attachment is not an image!");
                    const options = {
                        fit: 'box',
                        width: Math.round(attachment.width / (10 * 0.42)),
                        height: Math.round(attachment.height / 10)
                    }
                    const msg = await message.channel.send("Image received! Processing ASCII art... (Note: The quality of the generated art depends on the resolution of the image!)");
                    msg.channel.startTyping();
                    try {
                        const asciis = await asciify(attachment.url, options);
                        const lines = asciis.split("\n");
                        const height = lines.length * 18;
                        const tempCanvas = createCanvas(420, 69);
                        const tempCtx = tempCanvas.getContext("2d");
                        tempCtx.font = "14px Courier New";
                        const width = tempCtx.measureText(anser.ansiToText(lines[0])).width;

                        const canvas = createCanvas(width, height);
                        const ctx = canvas.getContext("2d");
                        ctx.font = "15px Courier New";
                        ctx.textBaseline = "top";
                        ctx.textAlign = "left";
                        ctx.fillStyle = 'dimgray';
                        ctx.fillRect(0, 0, width, height);
                        var num = 0;
                        for (const line of lines) {
                            var words = anser.ansiToJson(line);
                            words = words.filter(x => x.content.length > 0);
                            for (let i = 0; i < words.length; i++) {
                                ctx.fillStyle = 'white';
                                if (words[i].fg) ctx.fillStyle = `rgb(${words[i].fg})`;
                                ctx.fillText(words[i].content, i * width / anser.ansiToText(line).length, num * 18);
                            }
                            num++;
                        }
                        const nameArr = attachment.name.split(".");
                        nameArr.splice(-1, 1);
                        const newattachment = new Discord.MessageAttachment(canvas.toBuffer(), sanitize(`${nameArr.join(".")}.png`));
                        const colorAtt = new Discord.MessageAttachment(Buffer.from(asciis, 'utf8'), sanitize(`${nameArr.join(" ")}_text.txt`));
                        const noColorAtt = new Discord.MessageAttachment(Buffer.from(anser.ansiToText(asciis), 'utf8'), sanitize(`${nameArr.join(" ")}_text_no_color.txt`));
                        await msg.delete().catch(() => { });
                        await message.channel.send(newattachment);
                        await message.channel.send(colorAtt);
                        await message.channel.send(noColorAtt);
                    } catch (err) {
                        NorthClient.storage.error(err);
                        return await msg.edit(`<@${message.author.id}>, there was an error trying to convert the image into ASCII!`);
                    } finally {
                        msg.channel.stopTyping(true);
                    }
                });
                break;
            default:
                return await message.channel.send(`That is not a valid subcommand! Subcommands: \`${this.subcomamnds.join(", ")}\``)
        }
    }
}