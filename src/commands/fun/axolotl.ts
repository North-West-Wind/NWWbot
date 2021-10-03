import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { getFetch } from "../../function";
import * as Discord from "discord.js";


const fetch = getFetch();
const links = [
    "https://i.redd.it/kxtmqdzdwra41.png",
    "https://i.pinimg.com/originals/74/a5/4b/74a54bc2dcf744ed8772b495f6d572b1.jpg",
    "https://i.pinimg.com/564x/94/c1/80/94c1800a5c1a06e8c732832e6e50c778.jpg",
    "https://i.redd.it/jvhfaauy2pa21.jpg",
    "https://i.pinimg.com/564x/fb/b4/f5/fbb4f5c3b1c27cfc6d6ded28716d71aa.jpg",
    "https://i.pinimg.com/564x/63/80/98/63809831d3a74dba6f87b941c7c74a57.jpg",
    "https://i.pinimg.com/564x/8b/b1/e5/8bb1e50302301dba5b554f77a2af9cbb.jpg",
    "https://i.pinimg.com/564x/4a/83/fb/4a83fb443b6c00d13b88d4c09609498e.jpg",
    "https://i.pinimg.com/564x/76/a0/26/76a026f89e5ae723e2f96e896878dea2.jpg",
    "https://i.redd.it/r88snee8yyb41.jpg",
    "https://i.pinimg.com/564x/f3/54/cd/f354cdb43dc452cdb1658d64d1034605.jpg",
    "https://i.pinimg.com/564x/c0/4e/37/c04e37eb133d91e94e856f4a711cb19c.jpg",
    "https://i.redd.it/94jq9cp6clr01.jpg",
    "https://i.pinimg.com/564x/b0/2a/29/b02a29b9d942e349f8e647c4a09e26c4.jpg",
    "https://i.imgur.com/aSWtpDa.gif",
    "https://cdn.discordapp.com/attachments/763034826931699730/763034891386224650/d43494674776cd9cd26231ebc1d87ea4.gif",
    "https://i.redd.it/pvn3kxsx5we51.jpg",
    "https://i.redd.it/0passzba8wl21.jpg",
    "https://i.redd.it/cxto0wbm93r21.png",
    "https://i.redd.it/fslidz6veshy.jpg",
    "https://i.imgur.com/gGH3cUM.jpeg",
    "https://i.imgur.com/aPQxpYS.jpg",
    "https://i.imgur.com/qjfMw7p.jpeg",
    "https://cdn.discordapp.com/attachments/763034826931699730/763037008708239370/axolotl.jpg",
    "https://i.redd.it/8r38n9a7h3o51.png",
    "https://i.imgur.com/V5JPtQ3.jpg",
    "https://i.redd.it/p012qiq88ck51.jpg",
    "https://i.redd.it/ab5rafy0h7l51.jpg",
    "https://i.redd.it/u5fdc39444b51.jpg",
    "https://i.redd.it/adjl43n1npe31.png",
    "https://cdn.discordapp.com/attachments/763034826931699730/763038345319153684/r3696v2v6rn51.gif",
    "https://i.redd.it/usi861az4mx41.jpg"
];

class AxolotlCommand implements SlashCommand {
    name = "axolotl"
    description = "Retrieves a random Axolotl image."
    category = 3
    aliases = ["axol"]
    
    async execute(interaction: NorthInteraction) {
        const selected = links[Math.floor(Math.random() * links.length)];
        await interaction.reply(selected);
    }
    async run(message: NorthMessage) {
        const selected = links[Math.floor(Math.random() * links.length)];
        try {
            const res = await fetch(selected).then(res => res.body);
            const attachment = new Discord.MessageAttachment(res, `axolotl.${selected.split(".")[selected.split(".").length - 1]}`);
            await message.channel.send({files: [attachment]});
        } catch(err) {
            console.error(err);
            return await message.reply("There was an error fetching the axolotls!");
        }
    }
}

const cmd = new AxolotlCommand();
export default cmd;