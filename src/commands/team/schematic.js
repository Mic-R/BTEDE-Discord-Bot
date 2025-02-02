const {CommandInteraction, MessageAttachment} = require("discord.js");
const Command = require("../../classes/Command.js");
const axios = require("axios");
const Bot = require("../../classes/Bot.js");
const crypto = require("crypto");

class schematicCommand extends Command {
    constructor(client) {
        super(client, {
            name: "schematic", description: "Schematics command", userAvailable: false, options: [{
                name: "upload", description: "Uploads a schematic", type: 1, options: [{
                    name: "schematic",
                    description: "The schematic to upload",
                    type: 11,
                    required: true
                }, {
                    name: "terra",
                    description: "The terraserver to upload to",
                    type: 3,
                    required: true,
                    choices: client.config.status.map((s) => ({name: s.id, value: s.id})),
                }]
            }, {
                name: "list", description: "Lists all schematics on the given server", type: 1, options: [{
                    name: "terra",
                    description: "The terraserver to list schematics from",
                    type: 3,
                    required: true,
                    choices: client.config.status.map((s) => ({name: s.id, value: s.id})),
                }]
            }, {
                name: "download", description: "Downloads a schematic", type: 1, options: [{
                    name: "terra",
                    description: "The terraserver to download from",
                    type: 3,
                    required: true,
                    choices: client.config.status.map((s) => ({name: s.id, value: s.id})),
                }, {
                    name: "schematic", description: "The schematic to download", type: 3, required: true
                }]
            }],
        });
    }

    /**
     *
     * @param {CommandInteraction} interaction
     * @param {Bot} client
     */

    async run(interaction, client) {
        const terraname = await interaction.options._hoistedOptions.find((x) => x.name === "terra").value;

        if (interaction.options.getSubcommand() === "list") {
            await axios.get(`http://cloud.bte.ger:45655/api/schematics/list?terra=${terraname.replace(" ", "-")}`).then((res) => {
                return this.response(interaction, `Schematics on ${terraname}: \n` + "```" + res.data.join("\n").toString().replace(".schematic", "") + "```");
            }).catch((e) => {
                console.log(e.message);
                return this.error(interaction, `Failed to list schematics on ${terraname}!`);
            })
        }

        if (interaction.options.getSubcommand() === "upload") {
            const schemfile = await interaction.options._hoistedOptions.find((o) => o.name === "schematic").attachment;

            if (!schemfile) return this.error(interaction, "Please provide a valid schematic!");
            if (!schemfile.name.endsWith(".schematic")) return this.error(interaction, "Please provide the schematic in the form of a schematic!");

            console.log(schemfile.url);
            await axios.post("http://cloud.bte.ger:45655/api/schematics/upload", {
                "url": schemfile.url, "terra": terraname.replace(" ", "-"),
            }).then((res) => {
                return this.response(interaction, `Successfully uploaded the schematic to ${res.data.server} as ${res.data.fileName}.schematic`);
            }).catch((e) => {
                console.log(e.message);
                return this.error(interaction, `Failed to upload the schematic to ${terraname}!`);
            })
        }

        if (interaction.options.getSubcommand() === "download") {
            const name = await interaction.options._hoistedOptions.find((x) => x.name === "schematic").value;

            await axios.get(`http://cloud.bte.ger:45655/api/schematics/download?terra=${terraname.replace(" ", "-")}&name=${name}`, {responseType: "arraybuffer"})
                .then(async ({data: schem}) => {
                    console.log(schem)
                    const attachment = new MessageAttachment(schem, name + '.schematic');
                    await interaction.editReply("!og uoy ereH");
                    return client.channels.cache.get(interaction.channelId).send({content: null, files: [attachment]});
                })
                .catch(async (e) => {
                    await this.error(interaction, "Schematic not found");
                    return console.log(e);
                });
        }
    }
}

module.exports = schematicCommand;
