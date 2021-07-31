import { NorthClient, SlashCommand } from "../../classes/NorthClient";
import { Interaction } from "slashcord/dist/Index";
import * as Discord from "discord.js";
import { createCanvas } from "canvas";
import { hexToRgb, decimalToRgb } from "../../function";
function isArgsRgb(args, length) {
    for(let i = 0; i < length; i++) if(isNaN(parseInt(args[i])) || parseInt(args[i]) > 255 || parseInt(args[i]) < 0) return false;
    return true;
}
function getColor(args) {
    var red = Math.floor(Math.random() * 256);
    var green = Math.floor(Math.random() * 256);
    var blue = Math.floor(Math.random() * 256);
    var random = true;
    if(args.length >= 3 && isArgsRgb(args, 3)) {
        red = parseInt(args[0]);
        green = parseInt(args[1]);
        blue = parseInt(args[2]);
        random = false;
    } else if(args[0]) {
        var rgb = hexToRgb(args[0]);
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

class ColorCommand implements SlashCommand {
    name = "color"
    description = "Display the color you entered, or a random color."
    usage = "[color]"
    category = 3
    options = [{
        name: "color",
        description: "The color to display.",
        required: true,
        type: 3
    }];
    
    async execute(obj: { interaction: Interaction, args: any[], client: NorthClient }) {
        const args = obj.args?.map(x => x?.value).filter(x => !!x) || [];
        const { red, green, blue, random } = getColor(args);
        const em = new Discord.MessageEmbed()
        .setTitle(`Color: ${red} ${green} ${blue}`)
        .setColor([red, green, blue])
        .setDescription("← That is your color!\n(Sorry, slash commands currently doesn't allow sending attachments)")
        .setFooter(random ? "Cannot parse your color... so here's a random color." : `This is the color you want me to show. Do you like it?`, obj.client.user.displayAvatarURL());
        await obj.interaction.reply(em);
    }

    async run(message, args) {
        const { red, green, blue, random } = getColor(args);
        var canvas = createCanvas(1024, 1024);
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const em = new Discord.MessageEmbed()
        .setTitle(`Color: ${red} ${green} ${blue}`)
        .setColor([red, green, blue])
        .attachFiles([{ attachment: canvas.toBuffer(), name: `${red}_${green}_${blue}.png` }])
        .setImage(`attachment://${red}_${green}_${blue}.png`)
        .setFooter(random ? "Cannot parse your color... so here's a random color." : `This is the color you want me to show. Do you like it?`, message.client.user.displayAvatarURL());
        await message.channel.send(em);
    }
}

const cmd = new ColorCommand();
export default cmd;