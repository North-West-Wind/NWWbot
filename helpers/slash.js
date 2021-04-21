const { NorthClient } = require("../classes/NorthClient");
const deepEqual = require("deep-equal");
const { wait } = require("../function");
const { InteractionResponse } = require("../classes/Slash");

async function setup(client) {

    const exist = await client.api.applications(client.user.id).commands.get();
    for (const [name, command] of NorthClient.storage.commands) try {
        if (command.slashInit) {
            const registration = JSON.parse(JSON.stringify(await command.register()));
            var posted = exist.find(c => c.name === name);
            if (!posted) {
                await client.api.applications(client.user.id).commands.post({
                    data: registration
                });
                NorthClient.storage.log(`[${client.id}] Registered command "${name}"`);
            } else {
                delete posted["id"];
                delete posted["application_id"];
                delete posted["version"];
                delete posted["default_permission"];

                if (!deepEqual(posted, registration)) {
                    await client.api.applications(client.user.id).commands.post({
                        data: registration
                    });
                    NorthClient.storage.log(`[${client.id}] Registered command "${name}"`);
                }
            }
        }
    } catch (err) { NorthClient.storage.error(err); }
    NorthClient.storage.log(`[${client.id}] Registered all slash commands`);

    client.ws.on('INTERACTION_CREATE', async interaction => {
        const message = await InteractionResponse.createFakeMessage(client, interaction);
        if (message.guild && !(message.channel).permissionsFor(message.guild.me).has(84992)) {
            await client.api.interactions(interaction.id, interaction.token).callback.post({ data: JSON.parse(JSON.stringify(InteractionResponse.ackknowledge())) });
            return await message.author.send(`I need at least the permissions to \`${new Permissions(84992).toArray().join("`, `")}\` in order to run any command! Please tell your server administrator about that.`);
        }
        const cmd = interaction.data.name.toLowerCase();
        const args = interaction.data.options;

        const command = NorthClient.storage.commands.find(c => c.name === cmd);
        if (command) {
            var response;
            try { response = await command.slash(client, interaction, args || []); } catch (err) { NorthClient.storage.error(err); }
            if (!response) await client.api.interactions(interaction.id, interaction.token).callback.post({
                data: {
                    type: 4,
                    data: {
                        content: "Something went wrong during the interaction!"
                    }
                }
            });
            else await client.api.interactions(interaction.id, interaction.token).callback.post({
                data: JSON.parse(JSON.stringify(response))
            });
            await wait(500);
            if (command.postSlash) try {
                await command.postSlash(client, interaction, args || []);
            } catch (err) { NorthClient.storage.error(err); }
        }
    });
}

module.exports = setup;