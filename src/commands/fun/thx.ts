import { Interaction } from "slashcord/dist/Index";
import { NorthMessage, SlashCommand } from "../../classes/NorthClient";

class ThxCommand implements SlashCommand {
	name = 'thx'
	description = 'Thanks the bot.'
	category = 3
    
	async execute(obj: { interaction: Interaction }) {
		await obj.interaction.reply(`You're welcome, <@${obj.interaction.member?.id ?? obj.interaction.channelID}>`);
	}
	
    async run(message: NorthMessage) {
		await message.channel.send(`You're welcome, <@${message.author.id}>`);
	}
}

const cmd = new ThxCommand();
export default cmd;