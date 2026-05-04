const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Bot activo"));
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

const money = {};

// ================= SLASH =================
const commands = [
  new SlashCommandBuilder().setName("ping").setDescription("🏓 Pong"),

  new SlashCommandBuilder().setName("say")
    .setDescription("Repite texto")
    .addStringOption(o => o.setName("texto").setDescription("Texto").setRequired(true)),

  new SlashCommandBuilder().setName("8ball")
    .setDescription("Pregunta algo")
    .addStringOption(o => o.setName("pregunta").setDescription("Pregunta").setRequired(true)),

  new SlashCommandBuilder().setName("coinflip").setDescription("Cara o cruz"),
  new SlashCommandBuilder().setName("adivinar").setDescription("Color aleatorio"),

  new SlashCommandBuilder().setName("balance").setDescription("Ver dinero"),
  new SlashCommandBuilder().setName("daily").setDescription("Recompensa diaria"),

  new SlashCommandBuilder().setName("ban")
    .setDescription("Banear usuario")
    .addUserOption(o => o.setName("usuario").setDescription("Usuario").setRequired(true)),

  new SlashCommandBuilder().setName("kick")
    .setDescription("Kick usuario")
    .addUserOption(o => o.setName("usuario").setDescription("Usuario").setRequired(true)),

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
  } catch (e) {
    console.log(e);
  }
})();

// ================= READY =================
client.on("ready", () => {
  console.log(`Bot listo como ${client.user.tag}`);
});

// ================= HORA CHILE =================
function getChileTime() {
  return new Date().toLocaleTimeString("es-CL", {
    timeZone: "America/Santiago",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// ================= BIENVENIDA =================
client.on("guildMemberAdd", member => {
  const canal = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  if (!canal) return;

  const embed = new EmbedBuilder()
    .setColor(0xFFD700)
    .setTitle("🌟 ¡NUEVO MIEMBRO EN EL SERVIDOR! 🌟")
    .setDescription(
`Nos alegra tenerte por aquí, ${member.user}.

Asegúrate de leer las reglas y revisar nuestros canales del servidor.

🎮 ¿Qué ofrecemos?

• Comunidad activa  
• Más de 500 uncopylockeds  
• Staff rápido y eficiente  

Recuerda la normativa para evitar sanciones.`
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setFooter({
      text: `Eres el usuario #${member.guild.memberCount} del servidor • hoy a las ${getChileTime()}`
    });

  canal.send({
    content: `¡Hey ${member.user}, bienvenido a la comunidad!`,
    embeds: [embed]
  });
});

// ================= DESPEDIDA =================
client.on("guildMemberRemove", member => {
  const canal = member.guild.channels.cache.get(LEAVE_CHANNEL_ID);
  if (!canal) return;

  const embed = new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle("💔 UN MIEMBRO HA SALIDO")
    .setDescription(
`El usuario ${member.user} ha abandonado el servidor.

Esperamos que haya tenido una buena experiencia en la comunidad.

Siempre será bienvenido de vuelta.`
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setFooter({
      text: `Ahora somos ${member.guild.memberCount} miembros • hoy a las ${getChileTime()}`
    });

  canal.send({ embeds: [embed] });
});

// ================= PREFIX =================
client.on("messageCreate", async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  if (!message.guild) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  const id = message.author.id;
  if (!money[id]) money[id] = 0;

  if (cmd === "help") {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle("🤖 NIROX BOT PANEL")
      .addFields(
        { name: "⚡ Básicos", value: "`n!ping` `n!say` `n!adivinar` `n!coinflip`" },
        { name: "👤 Info", value: "`n!userinfo` `n!serverinfo` `n!avatar`" },
        { name: "🛡 Moderación", value: "`n!ban` `n!kick`" },
        { name: "💰 Economía", value: "`n!balance` `n!daily`" },
        { name: "⚡ Slash", value: "`/ping /say /8ball /coinflip /adivinar /balance /daily /ban /kick`" }
      );

    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "balance") return message.channel.send(`💰 ${money[id]} coins`);

  if (cmd === "daily") {
    money[id] += 100;
    return message.channel.send("💰 +100 coins");
  }

  if (cmd === "ban") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
      return message.reply("Sin permisos");

    const m = message.mentions.members.first();
    if (!m) return message.reply("Menciona alguien");

    m.ban();
    return message.channel.send("🔨 Baneado");
  }

  if (cmd === "kick") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers))
      return message.reply("Sin permisos");

    const m = message.mentions.members.first();
    if (!m) return message.reply("Menciona alguien");

    m.kick();
    return message.channel.send("👢 Kickeado");
  }

  if (cmd === "ping") return message.channel.send("🏓 Pong");

  if (cmd === "say") {
    const text = args.join(" ");
    if (!text) return message.reply("Escribe algo");

    await message.delete().catch(() => {});
    return message.channel.send(text);
  }

  if (cmd === "coinflip")
    return message.channel.send(Math.random() < 0.5 ? "Cara" : "Cruz");

  if (cmd === "adivinar") {
    const c = ["Rojo", "Azul", "Verde", "Negro", "Blanco"];
    return message.channel.send(c[Math.floor(Math.random() * c.length)]);
  }

  if (cmd === "userinfo") {
    const u = message.mentions.users.first() || message.author;
    return message.channel.send(u.tag);
  }

  if (cmd === "serverinfo")
    return message.channel.send(message.guild.name);

  if (cmd === "avatar") {
    const u = message.mentions.users.first() || message.author;
    return message.channel.send(u.displayAvatarURL());
  }
});

// ================= SLASH =================
client.on("interactionCreate", async (i) => {
  if (!i.isChatInputCommand()) return;

  const id = i.user.id;
  if (!money[id]) money[id] = 0;

  if (i.commandName === "ping") return i.reply("🏓 Pong");

  if (i.commandName === "balance")
    return i.reply(`💰 ${money[id]} coins`);

  if (i.commandName === "daily") {
    money[id] += 100;
    return i.reply("+100 coins");
  }

  if (i.commandName === "coinflip")
    return i.reply(Math.random() < 0.5 ? "Cara" : "Cruz");

  if (i.commandName === "adivinar") {
    const c = ["Rojo", "Azul", "Verde", "Negro", "Blanco"];
    return i.reply(c[Math.floor(Math.random() * c.length)]);
  }
});

client.login(process.env.TOKEN);
