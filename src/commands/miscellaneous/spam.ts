import { Interaction } from "slashcord";
import { NorthClient, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { findUser } from "../../function";

class SpamCommand implements SlashCommand {
    name = "spam"
    description = "Spam a user with the message provided."
    aliases = ["sp"]
    args = 3
    usage = "<user | user ID> <amount> <message>"
    category = 4
    options = [
        { name: "user", description: "The user to spam.", required: true, type: 6 },
        { name: "amount", description: "The number of time to spam the user.", required: true, type: 4 },
        { name: "message", description: "The message to send.", required: true, type: 3 }
    ]

    async execute(obj: { interaction: Interaction, args: any[], client: NorthClient }) {
        const author = obj.interaction.member?.user ?? await obj.client.users.fetch(obj.interaction.channelID);
        const taggedUser = await obj.client.users.fetch(obj.args[0].value);
        if (taggedUser.id === author.id) return await obj.interaction.reply("Don't try to spam youself.");
        const time = parseInt(obj.args[1].value);
        if (time > 120) return await obj.interaction.reply("Please don't spam more than 120 times. That would be annoying.")
        const msg = obj.args[2].value;
        var i = 0;
        var spam = setInterval(async function () {
            if (i == time) return clearInterval(spam);
            if (taggedUser.id === process.env.DC) await author.send("Admin power forbids this >:)").catch(() => i = time);
            else await taggedUser.send(`\`[${obj.interaction.guild.name} : ${author.tag}]\` ${msg}`).catch(err => {
                if (author.id !== process.env.DC) author.send(`Failed to spam ${taggedUser.tag} for ${i + 1} time(s) due to \`${err.message}\`.`).catch(() => i = time);
            });
            i++;
        }, 1000);
        await obj.interaction.reply("Spamming started >:)");
    }

    async run(message: NorthMessage, args: string[]) {
        const taggedUser = await findUser(message, args[0]);
        if (!taggedUser) return;
        if (taggedUser.id === message.author.id) return message.channel.send("Don't try to spam youself.");

        const time = parseInt(args[1]);
        if (isNaN(time)) {
            return message.channel.send("The time you want to spam this user is not a number.")
        }
        if (time > 120) return message.channel.send("Please don't spam more than 120 times. That would be annoying.")

        const msg = args.slice(2).join(" ");
        message.delete().catch(() => { });
        var i = 0;
        var spam = setInterval(async function () {
            if (i == time) return clearInterval(spam);
            if (taggedUser.id === process.env.DC) await message.author.send("Admin power forbids this >:)").catch(() => i = time);
            else await taggedUser.send(`\`[${message.guild.name} : ${message.author.tag}]\` ${msg}`).catch(err => {
                if (message.author.id !== process.env.DC) message.author.send(`Failed to spam ${taggedUser.tag} for ${i + 1} time(s) due to \`${err.message}\`.`).catch(() => i = time);
            });
            i++;
        }, 1000);
    }
}

const cmd = new SpamCommand();
export default cmd;