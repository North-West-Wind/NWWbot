import { Message } from "discord.js";
import { NorthClient } from "./NorthClient";
import { ApplicationCommand, InteractionResponse } from "./Slash";

export interface Command {
    name: string;
    description: string;
    args?: number;
    usage?: number;
    category?: number;
    aliases?: string[];
    slashInit?: boolean;

    execute(message: Message, ...args: any[]): any | void;
}

export interface SlashCommand extends Command {
    register(): ApplicationCommand;
    slash(client: NorthClient, interaction: any, args: any[]): InteractionResponse;
}