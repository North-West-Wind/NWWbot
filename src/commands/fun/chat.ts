import { NorthClient, NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";

import cleverbot from "cleverbot-free";

const log = new Map();

class ChatCommand implements FullCommand {
    name = "chat"
    description = "Chat with the bot."
    usage = "<message>"
    category = 3
    args = 1
    options = [{
        name: "message",
        description: "The message to tell the bot.",
        required: true,
        type: "STRING"
    }];

    async execute(interaction: NorthInteraction) {
        await interaction.deferReply();
        const author = interaction.member.user;
        var past = log.get(author.id);
        if (!past || Date.now() - past.lastChat > 1800000) {
            log.set(author.id, {
                lastChat: Date.now(),
                messages: []
            });
            past = log.get(author.id);
        }
        const msg = interaction.options.getString("message");
        const response = await cleverbot(msg, past.messages);
        past.messages.push(msg);
        past.messages.push(response);
        log.set(author.id, past);
        await interaction.editReply(response);
    }

    async run(message: NorthMessage, args: string[]) {
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