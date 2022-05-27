import { Collection } from "discord.js";
import { DailyModule, NorthMessage, PrefixCommand } from "../../classes/NorthClient.js";
import { deepReaddir } from "../../function.js";

class DailyCommand implements PrefixCommand {
	name = "daily";
	description = "Setups to send you something to practice daily.";
	modules = new Collection<string, DailyModule>();

	async run(message: NorthMessage, args: string[]) {
		const module = this.modules.get(args[0]);
		if (!module) return await message.channel.send("There is no such module!");
		await message.channel.send(module.get());
	}

	constructor() {
		const files = deepReaddir("./out/src/daily").filter(file => file.endsWith(".js"));
		for (const file of files) {
			import(file).then(imported => {
				const module = <DailyModule> imported.default;
				module.update();
				this.modules.set(module.name, module);
			});
		}
	}
}

const cmd = new DailyCommand();
export default cmd;