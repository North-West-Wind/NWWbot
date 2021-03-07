import { Message } from "discord.js";

export interface Command {
    name: string;
    description: string;
    args?: number;
    usage?: number;
    category?: number;
    aliases?: string[];

    execute(message: Message, ...args: any[]): any | void;
}