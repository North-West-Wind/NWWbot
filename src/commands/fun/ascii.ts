import { NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";

import anser from "anser";
import figlet from "figlet";
import sanitize from "sanitize-filename";
import * as Discord from "discord.js";
import Canvas from "canvas";
import asciify from "asciify-image";
import { isImageUrl } from "../../function.js";

class AsciiCommand implements FullCommand {
    name = "ascii"
    description = "Generates ASCII arts from text or image."
    usage = "<subcommand>"
    category = 3
    subcomamnds = ["text", "image"]
    subdesc = ["Generate ASCII art from text.", "Generate ASCII art from image."]
    subusage = ["<subcommand> <text>", "<subcommand> <attachment>"]
    args = 2
    options = [{
        name: "text",
        description: "The text to be converted into ASCII art.",
        required: true,
        type: "STRING"
    }];
    
    async execute(interaction: NorthInteraction) {
        const txt = interaction.options.getString("text");
        const text = figlet.textSync(txt);
        const attachment = new Discord.AttachmentBuilder(Buffer.from(text, 'utf8')).setName(sanitize(`${txt}.txt`));
        await interaction.reply({files: [attachment]});
    }

    async run(message: NorthMessage, args: string[]) {
        if (!args[0]) return await message.channel.send(`Please provide a subcommand!\nUsage: \`${message.prefix}${this.name} ${this.usage}\`\nAvailable Subcommands: \`${this.subcomamnds.join(", ")}\``);
        switch (args[0].toLowerCase()) {
            case "text":
                if (!args[1]) return await message.channel.send("You didn't provide any text! If you want to convert an image, use the `image` subcommand.");
                const text = figlet.textSync(args.slice(1).join(" "));
                const attachment = new Discord.AttachmentBuilder(Buffer.from(text, 'utf8')).setName(sanitize(`${args.slice(1).join(" ")}.txt`));
                await message.channel.send({ files: [attachment] });
                break;
            case "image":
                if (message.attachments.size < 1) return await message.channel.send("You didn't provide any image! If you want to convert text, use the `text` subcommand.");
                message.attachments.forEach(async attachment => {
                    if (!isImageUrl(attachment.url)) return await message.channel.send("The attachment is not an image!");
                    const msg = await message.channel.send("Image received! Processing ASCII art... (Note: The quality of the generated art depends on the resolution of the image!)");
                    try {
                        const asciis = <string> await asciify(attachment.url, { fit: "box", width: Math.round(attachment.width / (10 * 0.42)), height: Math.round(attachment.height / 10) });
                        const lines = asciis.split("\n");
                        const height = lines.length * 18;
                        const tempCanvas = Canvas.createCanvas(420, 69);
                        const tempCtx = tempCanvas.getContext("2d");
                        tempCtx.font = "14px Courier New";
                        const width = tempCtx.measureText(anser.ansiToText(lines[0])).width;

                        const canvas = Canvas.createCanvas(width, height);
                        const ctx = canvas.getContext("2d");
                        ctx.font = "15px Courier New";
                        ctx.textBaseline = "top";
                        ctx.textAlign = "left";
                        ctx.fillStyle = 'dimgray';
                        ctx.fillRect(0, 0, width, height);
                        let num = 0;
                        for (const line of lines) {
                            let words = anser.ansiToJson(line);
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
                        const newattachment = new Discord.AttachmentBuilder(canvas.toBuffer()).setName(sanitize(`${nameArr.join(".")}.png`));
                        const colorAtt = new Discord.AttachmentBuilder(Buffer.from(asciis, 'utf8')).setName(sanitize(`${nameArr.join(" ")}_text.txt`));
                        const noColorAtt = new Discord.AttachmentBuilder(Buffer.from(anser.ansiToText(asciis), 'utf8')).setName(sanitize(`${nameArr.join(" ")}_text_no_color.txt`));
                        msg.delete().catch(() => { });
                        await message.channel.send({files: [newattachment]});
                        await message.channel.send({files: [colorAtt]});
                        await message.channel.send({files: [noColorAtt]});
                    } catch (err: any) {
                        console.error(err);
                        return await msg.edit(`<@${message.author.id}>, there was an error trying to convert the image into ASCII!`);
                    }
                });
                break;
            default:
                return await message.channel.send(`That is not a valid subcommand! Subcommands: \`${this.subcomamnds.join(", ")}\``)
        }
    }
}

const cmd = new AsciiCommand();
export default cmd;