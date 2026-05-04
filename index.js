const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot activo");
});

app.listen(10000);

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

require("dotenv").config();
const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    REST,
    Routes,
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const prefix = "n!";

const WELCOME_CHANNEL_ID = "1478407879076872386";
const LEAVE_CHANNEL_ID = "1478407852950294610";

// ================= SLASH COMMANDS =================
const commands = [
    new SlashCommandBuilder().setName("ping").setDescription("Responde pong"),

    new SlashCommandBuilder().setName("8ball")
        .setDescription("Pregunta algo")
        .addStringOption(o => o.setName("pregunta").setDescription("Pregunta").setRequired(true)),

    new SlashCommandBuilder().setName("say")
        .setDescription("El bot dice algo")
        .addStringOption(o => o.setName("texto").setDescription("Texto").setRequired(true)),

    new SlashCommandBuilder().setName("coinflip").setDescription("Cara o cruz"),
    new SlashCommandBuilder().setName("adivinar").setDescription("Adivinar"),
    new SlashCommandBuilder().setName("userinfo").setDescription("Info usuario"),
    new SlashCommandBuilder().setName("serverinfo").setDescription("Info server"),
    new SlashCommandBuilder().setName("avatar").setDescription("Avatar")
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationCommands("1500615147293769808"),
            { body: commands }
        );
    } catch (err) {
        console.log(err);
    }
})();

// ================= READY =================
client.on("ready", () => {
    console.log(`Bot listo como ${client.user.tag}`);
});

// ================= BIENVENIDA =================
client.on("guildMemberAdd", member => {
    const canal = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!canal) return;

    const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle("🌟 Bienvenido")
        .setDescription(`Bienvenido ${member.user.username}`)
        .setThumbnail(member.user.displayAvatarURL());

    canal.send({ embeds: [embed] });
});

// ================= DESPEDIDA =================
client.on("guildMemberRemove", member => {
    const canal = member.guild.channels.cache.get(LEAVE_CHANNEL_ID);
    if (!canal) return;

    const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("👋 Se fue un miembro")
        .setDescription(`${member.user.username} salió del servidor`);

    canal.send({ embeds: [embed] });
});

// ================= PREFIX COMMANDS =================
client.on("messageCreate", async (message) => {
    try {
        if (!message.content.startsWith(prefix) || message.author.bot) return;
        if (!message.guild) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const cmd = args.shift().toLowerCase();

        // HELP
        if (cmd === "help") {
            const embed = new EmbedBuilder()
                .setColor(0x000000)
                .setTitle("📜 COMANDOS NIROX")
                .setDescription(
`n!ping  
n!say  
n!adivinar  
n!coinflip  
n!userinfo  
n!serverinfo  
n!avatar  
n!help`
                );
            return message.channel.send({ embeds: [embed] });
        }

        // PING
        if (cmd === "ping") {
            return message.channel.send("🏓 Pong");
        }

        // SAY FIX
        if (cmd === "say") {
            const texto = args.join(" ");
            if (!texto) return message.reply("Uso: n!say hola");
            return message.channel.send(texto);
        }

        // COINFLIP
        if (cmd === "coinflip") {
            return message.channel.send(Math.random() < 0.5 ? "Cara" : "Cruz");
        }

        // ADIVINAR FIX
        if (cmd === "adivinar") {
            const respuestas = ["Rojo", "Azul", "Verde", "Negro", "Blanco"];
            return message.channel.send(respuestas[Math.floor(Math.random() * respuestas.length)]);
        }

        // USERINFO
        if (cmd === "userinfo") {
            const user = message.mentions.users.first() || message.author;
            return message.channel.send(`Usuario: ${user.tag}`);
        }

        // SERVERINFO
        if (cmd === "serverinfo") {
            return message.channel.send(`Servidor: ${message.guild.name}`);
        }

        // AVATAR
        if (cmd === "avatar") {
            const user = message.mentions.users.first() || message.author;
            return message.channel.send(user.displayAvatarURL());
        }

    } catch (err) {
        console.log(err);
        message.channel.send("Error en comando");
    }
});

// ================= SLASH =================
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const name = interaction.commandName;

    if (name === "ping") return interaction.reply("🏓 Pong");

    if (name === "8ball") {
        const respuestas = ["Sí", "No", "Tal vez"];
        return interaction.reply(respuestas[Math.floor(Math.random() * respuestas.length)]);
    }

    if (name === "say") {
        const texto = interaction.options.getString("texto");
        return interaction.reply(texto);
    }

    if (name === "coinflip") {
        return interaction.reply(Math.random() < 0.5 ? "Cara" : "Cruz");
    }

    if (name === "adivinar") {
        const respuestas = ["Rojo", "Azul", "Verde", "Negro", "Blanco"];
        return interaction.reply(respuestas[Math.floor(Math.random() * respuestas.length)]);
    }

    if (name === "userinfo") {
        const user = interaction.options.getUser("usuario") || interaction.user;
        return interaction.reply(user.tag);
    }

    if (name === "serverinfo") {
        return interaction.reply(interaction.guild.name);
    }

    if (name === "avatar") {
        const user = interaction.options.getUser("usuario") || interaction.user;
        return interaction.reply(user.displayAvatarURL());
    }
});

client.login(process.env.TOKEN);
