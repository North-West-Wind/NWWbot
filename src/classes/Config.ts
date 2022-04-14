import { EmojiIdentifierResolvable, Message, MessageButtonStyle, MessageEmbed, Snowflake } from "discord.js";
import { capitalize, query } from "../function";
import { NorthClient } from "./NorthClient";

type OptionType = "message" | "channel" | "image" | "roles" | "reaction" | "duration" | "boolean";

interface StorageInfo {
    column: string;
    location?: string[];
}

class Base {
    id: string;
    name: string;
    description: string;
    style?: MessageButtonStyle;
    emoji?: EmojiIdentifierResolvable;
}

export class Setting extends Base {
    type: OptionType;
    time: number;
    storage: StorageInfo;
    longname: string;
    max?: number;
    default?: any;

    constructor(id: string, name: string, description: string, type: OptionType, time: number, style?: MessageButtonStyle, emoji?: string, longname?: string) {
        super();
        this.id = id;
        this.name = name || capitalize(this.id);
        this.description = description;
        this.type = type;
        this.time = time;
        this.style = style;
        this.emoji = emoji;
        this.longname = longname || this.name;
        if (type === "roles") this.max = 25;
    }

    info(storage: StorageInfo) {
        this.storage = storage;
        return this;
    }

    def(val: any) {
        this.default = val;
        return this;
    }

    async handler?(msg: Message, value: any): Promise<void>;
}

export class Category extends Base {
    children: (Setting | Category)[];

    constructor(...children: (Setting | Category)[]) {
        super();
        this.children = children;
    }

    info(information: Base) {
        this.id = information.id;
        this.name = information.name;
        this.description = information.description;
        this.style = information.style;
        this.emoji = information.emoji;
        return this;
    }
}

export class SafeSetting extends Setting {
    async handler(msg: Message, value: any) {
        if (value) {
            for (const command of NorthClient.storage.commands.values()) {
              if (command.category !== 5) continue;
              try {
                const options = {
                  name: command.name,
                  description: command.description,
                  options: command.options
                };
                await msg.client.application.commands.create(options, msg.guildId);
              } catch (err: any) {
                console.error("Failed to create slash command " + command.name);
                console.error(err);
              }
            }
        } else {
            const commands = await msg.guild.commands.fetch();
            for (const command of commands.values()) {
              if (NorthClient.storage.commands.get(command.name)?.category !== 5) continue;
              try {
                await msg.client.application.commands.delete(command.id, command.guildId);
              } catch (err: any) {
                console.error("Failed to delete slash command " + command.name);
                console.error(err);
              }
            }
        }
    }
}