import { EmojiIdentifierResolvable, Guild, Message, MessageButtonStyle, MessageEmbed, Snowflake } from "discord.js";
import { capitalize, query } from "../function.js";
import { NorthClient } from "./NorthClient.js";

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
  extra?: any;
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
    if (type === "roles") this.extra = { max: 25 }
  }

  info(storage: StorageInfo) {
    this.storage = storage;
    return this;
  }

  def(val: any) {
    this.default = val;
    return this;
  }
}

export class Category extends Base {
  children: (Setting | Category)[];

  constructor(children: (Setting | Category)[]);
  constructor(breeder: { (self: Category, guild: Guild): Promise<void> });
  constructor(breederOrChildren: (Setting | Category)[] | { (self: Category, guild: Guild): Promise<void> }) {
    super();
    if (Array.isArray(breederOrChildren)) this.children = breederOrChildren;
    else this.breeder = breederOrChildren;
  }

  async breeder?(self: Category, guild: Guild): Promise<void>;

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
  constructor(id: string, name: string, description: string, time: number, style?: MessageButtonStyle, emoji?: string, longname?: string) {
    super(id, name, description, "boolean", time, style, emoji, longname);
    this.extra = { post: this.handler };
  }

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

export class TemplateSetting extends Setting {
  constructor(id: string, name: string, description: string, time: number, style?: MessageButtonStyle, emoji?: string, longname?: string) {
    super(id, name, description, "message", time, style, emoji, longname);
    this.extra = { sql: this.sql };
  }

  async sql(_column: string, _val: any, guild: Snowflake) {
    await query(`UPDATE server SET templates = "${encodeURIComponent(JSON.stringify(NorthClient.storage.guilds[guild].applications.templates.map((val, key) => { const obj = {}; obj[key] = val; return obj; })))}" WHERE id = ${guild}`);
  }
}

export type SettableType = "message" | "channel" | "image" | "roles" | "reaction" | "duration" | "boolean";
type SettableKeyType = "role";
export class KeyType {
  key: SettableKeyType;
  value: SettableType;

  constructor(key: SettableKeyType, value: SettableType) {
    this.key = key;
    this.value = value;
  }
}