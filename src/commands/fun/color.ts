import { NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";

import * as Discord from "discord.js";
import Canvas from "canvas";
import { hexToRgb, decimalToRgb } from "../../function.js";
function isArgsRgb(args: string[], length: number) {
    for(let i = 0; i < length; i++) if(isNaN(parseInt(args[i])) || parseInt(args[i]) > 255 || parseInt(args[i]) < 0) return false;
    return true;
}
function getColor(args: string[]): { red?: number, green?: number, blue?: number, random: boolean } {
    if (!args?.length) return { random: true };
    let red = Math.floor(Math.random() * 256);
    let green = Math.floor(Math.random() * 256);
    let blue = Math.floor(Math.random() * 256);
    let random = true;
    if(args.length >= 3 && isArgsRgb(args, 3)) {
        red = parseInt(args[0]);
        green = parseInt(args[1]);
        blue = parseInt(args[2]);
        random = false;
    } else if(args[0]) {
        let rgb = hexToRgb(args[0]);
        if(rgb) {
            red = rgb.r;
            green = rgb.g;
            blue = rgb.b;
            random = false;
        } else if(!isNaN(parseInt(args[0])) && parseInt(args[0]) < Math.pow(256, 3) && parseInt(args[0]) > 0) {
            rgb = decimalToRgb(parseInt(args[0]));
            red = rgb.r;
            green = rgb.g;
            blue = rgb.b;
            random = false;
        }
    }
    return { red, green, blue, random };
}

class ColorCommand implements FullCommand {
    name = "color"
    description = "Displays the color you entered, or a random color."
    usage = "[color]"
    category = 3
    options = [{
        name: "color",
        description: "The color to display.",
        required: false,
        type: "STRING"
    }];
    
    async execute(interaction: NorthInteraction) {
        const args = interaction.options.getString("color")?.split(/ +/);
        const { red, green, blue, random } = getColor(args);
        const canvas = Canvas.createCanvas(1024, 1024);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const em = new Discord.EmbedBuilder()
        .setTitle(`Color: ${red} ${green} ${blue}`)
        .setColor([red, green, blue])
        .setImage(`attachment://${red}_${green}_${blue}.png`)
        .setFooter({ text: random ? "Cannot parse your color... so here's a random color." : `This is the color you want me to show. Do you like it?`, iconURL: interaction.client.user.displayAvatarURL() });
        await interaction.reply({embeds: [em], files: [{ attachment: canvas.toBuffer(), name: `${red}_${green}_${blue}.png` }]});
    }

    async run(message: NorthMessage, args: string[]) {
        const { red, green, blue, random } = getColor(args);
        const canvas = Canvas.createCanvas(1024, 1024);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const em = new Discord.EmbedBuilder()
        .setTitle(`Color: ${red} ${green} ${blue}`)
        .setColor([red, green, blue])
        .setImage(`attachment://${red}_${green}_${blue}.png`)
        .setFooter({ text: random ? "Cannot parse your color... so here's a random color." : `This is the color you want me to show. Do you like it?`, iconURL: message.client.user.displayAvatarURL() });
        await message.channel.send({embeds: [em], files: [{ attachment: canvas.toBuffer(), name: `${red}_${green}_${blue}.png` }]});
    }
}

const cmd = new ColorCommand();
export default cmd;