import { NorthClient, SlashCommand } from "../../classes/NorthClient";
import { Interaction } from "slashcord";
import cleverbot from "cleverbot-free";

const log = new Map();

class ChatCommand implements SlashCommand {
    name = "chat"
    description = "Chat with the bot."
    usage = "<message>"
    category = 3
    args = 1
    options = [{
        name: "message",
        description: "The message to tell the bot.",
        required: true,
        type: 3
    }];

    async execute(obj: { interaction: Interaction, client: NorthClient, args: any[] }) {
        const author = obj.interaction.member.user;
        var past = log.get(author.id);
        if (!past || Date.now() - past.lastChat > 1800000) {
            log.set(author.id, {
                lastChat: Date.now(),
                messages: []
            });
            past = log.get(author.id);
        }
        const response = await cleverbot(obj.args[0].value, past.messages);
        past.messages.push(obj.args[0].value);
        past.messages.push(response);
        log.set(author.id, past);
        await obj.interaction.reply(response);
    }

    async run(message, args) {
        var past = log.get(message.author.id);
        if (!past || Date.now() - past.lastChat > 1800000) {
            log.set(message.author.id, {
                lastChat: Date.now(),
                messages: []
            });
            past = log.get(message.author.id);
        }
        const response = await cleverbot(args.join(" "), past.messages);
        past.messages.push(args.join(" "));
        past.messages.push(response);
        log.set(message.author.id, past);
        await message.channel.send(response);
    }
}

const cmd = new ChatCommand();
export default cmd;