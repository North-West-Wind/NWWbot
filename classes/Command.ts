import { NorthClient } from "./NorthClient";
import { NorthMessage } from "./NorthMessage";
import { Interaction } from "slashcord/dist/utilities/interaction";
import { CommandHandler } from "slashcord/dist/handlers/CommandHandler";

export interface Command {
    name: string;
    description: string;
    args?: number;
    usage?: string;
    category?: number;
    aliases?: string[];
    subcommands?: string[];
    subaliases?: string[];
    permission?: number;
    slashInit?: boolean;

    run(message: NorthMessage, args: string[]): Promise<any | void>;
}

export interface SlashCommand extends Command {
    options?: any[];
    testOnly?: boolean;
    devOnly?: boolean;

    execute(args: { client: NorthClient, interaction: Interaction, args: any, handler: CommandHandler }): Promise<any | void>;
}