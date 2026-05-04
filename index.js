require('dotenv').config();

const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("Bot activo");
});

// IMPORTANTE: puerto dinámico para Render
app.listen(process.env.PORT || 10000);

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

const { Client, GatewayIntentBits, PermissionsBitField, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const prefix = "n!";

// 🔥 IDs DE CANALES
const WELCOME_CHANNEL_ID = "1478407879076872386";
const LEAVE_CHANNEL_ID = "1478407852950294610";

// ================= SLASH COMMANDS =================
const commands = [
    new SlashCommandBuilder().setName('ping').setDescription('Responde pong'),

    new SlashCommandBuilder().setName('8ball')
        .setDescription('Pregunta algo')
        .addStringOption(o => o.setName('pregunta').setDescription('Tu pregunta').setRequired(true)),

    new SlashCommandBuilder().setName('say')
        .setDescription('El bot dice algo')
        .addStringOption(o => o.setName('texto').setDescription('Texto').setRequired(true)),

    new SlashCommandBuilder().setName('clear')
        .setDescription('Borrar mensajes')
        .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad').setRequired(true)),

    new SlashCommandBuilder().setName('ban').setDescription('Banear')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true)),

    new SlashCommandBuilder().setName('kick').setDescription('Kick')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true)),

    new SlashCommandBuilder().setName('mute').setDescription('Mute')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true)),

    new SlashCommandBuilder().setName('unmute').setDescription('Unmute')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true)),

    new SlashCommandBuilder().setName('warn').setDescription('Warn')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true)),

    new SlashCommandBuilder().setName('nick').setDescription('Nick')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
        .addStringOption(o => o.setName('nombre').setDescription('Nuevo nick').setRequired(true)),

    new SlashCommandBuilder().setName('ruleta').setDescription('Ruleta'),
    new SlashCommandBuilder().setName('adivinar').setDescription('Adivinar'),
    new SlashCommandBuilder().setName('coinflip').setDescription('Cara o cruz'),

    new SlashCommandBuilder().setName('userinfo').setDescription('Info usuario')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario')),

    new SlashCommandBuilder().setName('serverinfo').setDescription('Info server'),

    new SlashCommandBuilder().setName('avatar').setDescription('Avatar')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario'))
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

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
client.on('ready', () => {
    console.log(`Nirox listo como ${client.user.tag}`);
});

// ================= BIENVENIDA =================
client.on('guildMemberAdd', member => {
    const canal = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!canal) return;

    const fecha = new Date();
    const hora = fecha.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit'
    });

    canal.send(`¡Hey ${member.user}, bienvenido a la comunidad!`);

    const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle("🌟 ¡NUEVO MIEMBRO EN LA TIENDA! 🌟")
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setDescription(
`Nos alegra tenerte por aquí, **${member.user.username}**. Asegúrate de leer las reglas y revisar nuestros canales.

🎮 ¿Qué ofrecemos?
• Comunidad activa.
• Más de 500 uncopylockeds.
• Staff rápido y eficiente.

Recuerda leer las normas.`
        )
        .setFooter({
            text: `Eres el usuario #${member.guild.memberCount} del servidor • hoy a las ${hora}`
        });

    canal.send({ embeds: [embed] });
});

// ================= DESPEDIDA =================
client.on('guildMemberRemove', member => {
    const canal = member.guild.channels.cache.get(LEAVE_CHANNEL_ID);
    if (!canal) return;

    const fecha = new Date();
    const hora = fecha.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit'
    });

    canal.send(`😢 ${member.user} ha salido de la comunidad...`);

    const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("❌ UN MIEMBRO HA SALIDO ❌")
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setDescription(
`El usuario **${member.user.username}** ha abandonado el servidor.

Esperamos que haya tenido una buena experiencia.`
        )
        .setFooter({
            text: `Ahora somos ${member.guild.memberCount} miembros • hoy a las ${hora}`
        });

    canal.send({ embeds: [embed] });
});

// ================= PREFIX =================
client.on('messageCreate', async (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(/ +/);
    const cmd = args.shift().toLowerCase();

    if (cmd === "help") {
        const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle("📜 NIROX COMMANDS")
            .setDescription("Todos los comandos disponibles")
            .addFields(
                { name: "🔧 Moderación", value: "ban, kick, mute, unmute, warn, nick, clear" },
                { name: "🎮 Diversión", value: "8ball, ruleta, adivinar, coinflip" },
                { name: "🛠 Utilidad", value: "ping, say, userinfo, serverinfo, avatar" }
            );
        message.channel.send({ embeds: [embed] });
    }

    if (cmd === "unmute") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

        const user = message.mentions.members.first();
        if (!user) return message.reply("Usuario no encontrado");

        let role = message.guild.roles.cache.find(r => r.name === "Muted");
        if (!role) return message.reply("No existe rol Muted");

        user.roles.remove(role);
        message.channel.send("🔊 Desmuteado");
    }

    if (cmd === "coinflip") {
        message.channel.send(Math.random() < 0.5 ? "Cara" : "Cruz");
    }

    if (cmd === "userinfo") {
        const user = message.mentions.users.first() || message.author;
        message.channel.send(`Usuario: ${user.tag}`);
    }

    if (cmd === "serverinfo") {
        message.channel.send(`Servidor: ${message.guild.name}`);
    }

    if (cmd === "avatar") {
        const user = message.mentions.users.first() || message.author;
        message.channel.send(user.displayAvatarURL());
    }
});

// ================= SLASH =================
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const name = interaction.commandName;

    if (name === "ping") return interaction.reply("🏓 Pong");

    if (name === "8ball") {
        const respuestas = ["Sí", "No", "Tal vez"];
        return interaction.reply(respuestas[Math.floor(Math.random() * respuestas.length)]);
    }

    if (name === "say") {
        const texto = interaction.options.getString('texto');
        if (texto.includes("@everyone") || texto.includes("@here"))
            return interaction.reply("No permitido");

        return interaction.reply(texto);
    }

    if (name === "clear") {
        if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator))
            return;

        const amount = interaction.options.getInteger('cantidad');
        await interaction.channel.bulkDelete(amount);
        return interaction.reply(`🧹 ${amount} eliminados`);
    }

    if (name === "ban") {
        const user = interaction.options.getMember('usuario');
        if (user) user.ban();
        return interaction.reply("Baneado");
    }

    if (name === "kick") {
        const user = interaction.options.getMember('usuario');
        if (user) user.kick();
        return interaction.reply("Kickeado");
    }

    if (name === "mute") {
        const user = interaction.options.getMember('usuario');
        let role = interaction.guild.roles.cache.find(r => r.name === "Muted");
        if (!role) role = await interaction.guild.roles.create({ name: "Muted" });

        user.roles.add(role);
        return interaction.reply("Muteado");
    }

    if (name === "unmute") {
        const user = interaction.options.getMember('usuario');
        let role = interaction.guild.roles.cache.find(r => r.name === "Muted");
        if (!role) return interaction.reply("No hay rol Muted");

        user.roles.remove(role);
        return interaction.reply("Desmuteado");
    }

    if (name === "warn") {
        const user = interaction.options.getUser('usuario');
        return interaction.reply(`⚠️ ${user.tag} advertido`);
    }

    if (name === "nick") {
        const user = interaction.options.getMember('usuario');
        const nombre = interaction.options.getString('nombre');
        user.setNickname(nombre);
        return interaction.reply("Nick cambiado");
    }

    if (name === "ruleta")
        return interaction.reply(Math.random() < 0.5 ? "💀 Perdiste" : "🎉 Ganaste");

    if (name === "adivinar")
        return interaction.reply(`Número: ${Math.floor(Math.random() * 10)}`);

    if (name === "coinflip")
        return interaction.reply(Math.random() < 0.5 ? "Cara" : "Cruz");

    if (name === "userinfo") {
        const user = interaction.options.getUser('usuario') || interaction.user;
        return interaction.reply(user.tag);
    }

    if (name === "serverinfo")
        return interaction.reply(interaction.guild.name);

    if (name === "avatar") {
        const user = interaction.options.getUser('usuario') || interaction.user;
        return interaction.reply(user.displayAvatarURL());
    }
});

client.login(process.env.TOKEN);
