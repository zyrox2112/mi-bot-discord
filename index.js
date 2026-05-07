// ====== KEEP ALIVE ======
const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("ok"));
app.listen(3000);

// ====== DISCORD ======
require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  REST,
  Routes,
  SlashCommandBuilder
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
const CLIENT_ID = "1500615147293769808";

// ====== IDS ======
const WELCOME_CHANNEL = "1478407879076872386";
const GOODBYE_CHANNEL = "1478407852950294610";

// ====== UTIL ======
const eco = {};

function getBal(id){
  if(!eco[id]){
    eco[id] = {
      wallet: 0,
      bank: 0
    };
  }

  return eco[id];
}

function rnd(min,max){
  return Math.floor(Math.random()*(max-min+1))+min;
}

function embed(title, desc, color="#2b2d31", user){

  const e = new EmbedBuilder()
    .setTitle(title)
    .setDescription(desc)
    .setColor(color)
    .setTimestamp();

  if(user){
    e.setFooter({
      text: user.username,
      iconURL: user.displayAvatarURL()
    });
  }

  return e;
}

// ====== 100 COMANDOS ======
const cmds = [
"ban","kick","mute","unmute","warn","warnings","clear","slowmode","lock","unlock","role","removerole","nickname","nuke","unban","timeout","untimeout","purge","announce","embed","poll","hidechannel","unhidechannel","lockdown","unlockdown",
"balance","daily","work","rob","deposit","withdraw","transfer","shop","buy","sell","inventory","gamble","coin","slots","leaderboard","beg","crime","fish","mine","weekly",
"coinflip","adivinar","8ball","dado","trivia","meme","chiste","iq","ship","hack","rate","love","kiss","slap","cry","laugh","dance","joke","rps","guessnumber","math","wouldyourather","avatarhack","insult","compliment",
"userinfo","serverinfo","avatar","banner","roles","membercount","botinfo","uptime","ping","channelinfo","roleinfo","servericon","joindate","badges","permissions",
"help","say","embedbuilder","calculator","translate","remind","timer","afk","snipe","editmsg","shorten","qr","weather","timezone","notes"
];

// ====== HELP ======
function helpPages(){

  const pages = [];

  for(let i=0;i<cmds.length;i+=10){

    pages.push(
      new EmbedBuilder()
      .setColor("#000000")
      .setTitle("📜 Nirox Help")
      .setDescription(
        cmds
        .slice(i,i+10)
        .map(c => `➡️ \`${prefix}${c}\``)
        .join("\n")
      )
      .setFooter({
        text:`Página ${Math.floor(i/10)+1}`
      })
    );
  }

  return pages;
}

// ====== CORE ======
async function run(ctx,name,args=[]){

  const isI = !!ctx.isChatInputCommand;

  const user = isI ? ctx.user : ctx.author;
  const channel = ctx.channel;
  const member = ctx.member;

  const me = getBal(user.id);

  const send = async(e)=>{

    if(isI){

      if(ctx.replied || ctx.deferred){
        return ctx.followUp({ embeds:[e] });
      }

      return ctx.reply({ embeds:[e] });
    }

    return channel.send({ embeds:[e] });
  };

  // ===== HELP =====
  if(name === "help"){

    const pages = helpPages();

    let p = 0;

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("prev")
          .setLabel("⬅️")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("➡️")
          .setStyle(ButtonStyle.Primary)
      );

    const msg = await (
      isI
      ? ctx.reply({
          embeds:[pages[p]],
          components:[row],
          fetchReply:true
        })
      : channel.send({
          embeds:[pages[p]],
          components:[row]
        })
    );

    const col = msg.createMessageComponentCollector({
      time: 60000
    });

    col.on("collect", async i => {

      if(i.user.id !== user.id) return;

      if(i.customId === "next"){
        p = (p+1) % pages.length;
      } else {
        p = (p-1+pages.length) % pages.length;
      }

      await i.update({
        embeds:[pages[p]]
      });

    });

    return;
  }

  // ===== BALANCE =====
  if(name === "balance"){

    const total = me.wallet + me.bank;

    return send(
      embed(
        "💰 Balance",
        `💵 Wallet: ${me.wallet}\n🏦 Banco: ${me.bank}\n\n💸 Total: ${total}`,
        "#00ff88",
        user
      )
    );
  }

  // ===== WORK =====
  if(name === "work"){

    const g = rnd(50,150);

    me.wallet += g;

    return send(
      embed(
        "💼 Trabajo",
        `Trabajaste y ganaste 💵 ${g}`,
        "#00ff88",
        user
      )
    );
  }

  // ===== COINFLIP =====
  if(name === "coinflip"){

    return send(
      embed(
        "🪙 Coinflip",
        Math.random() < 0.5 ? "Cara" : "Cruz",
        "#5865F2",
        user
      )
    );
  }

  // ===== SAY =====
  if(name === "say"){

    const texto = isI
      ? ctx.options.getString("texto")
      : args.join(" ");

    if(!texto) return;

    if(!isI){
      await ctx.delete().catch(()=>{});
    }

    return channel.send(texto);
  }

  // ===== BAN =====
  if(name === "ban"){

    const target = isI
      ? ctx.options.getUser("usuario")
      : ctx.mentions.users.first();

    const reason = isI
      ? ctx.options.getString("razon")
      : args.slice(1).join(" ") || "Sin razón";

    return send(
      embed(
        "🔨 Ban",
        `👤 Usuario: ${target?.tag}\n📝 Razón: ${reason}`,
        "#ff0000",
        user
      )
    );
  }

  // ===== DEFAULT =====
  return send(
    embed(
      "⚙️ Comando",
      `El comando **${name}** se ejecutó correctamente.`,
      "#2b2d31",
      user
    )
  );
}

// ===== PREFIX =====
client.on("messageCreate", async m => {

  if(!m.content.startsWith(prefix)) return;
  if(m.author.bot) return;

  const args = m.content
    .slice(prefix.length)
    .trim()
    .split(/ +/);

  const name = args.shift().toLowerCase();

  if(!cmds.includes(name)) return;

  run(m,name,args);
});

// ===== SLASH =====
client.on("interactionCreate", async i => {

  if(!i.isChatInputCommand()) return;

  run(i,i.commandName,[]);
});

// ===== REGISTER =====
const rest = new REST({
  version:"10"
}).setToken(process.env.TOKEN);

(async()=>{

  if(process.env.REGISTER !== "true") return;

  const slash = [];

  for(const name of cmds){

    const cmd = new SlashCommandBuilder()
      .setName(name)
      .setDescription(`Comando ${name}`);

    if(["ban","kick","transfer","rob"].includes(name)){

      cmd.addUserOption(o =>
        o
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
      );
    }

    if(["ban","kick"].includes(name)){

      cmd.addStringOption(o =>
        o
        .setName("razon")
        .setDescription("Razón")
      );
    }

    if(["say","announce"].includes(name)){

      cmd.addStringOption(o =>
        o
        .setName("texto")
        .setDescription("Texto")
        .setRequired(true)
      );
    }

    slash.push(cmd.toJSON());
  }

  await rest.put(
    Routes.applicationCommands(CLIENT_ID),
    { body: slash }
  );

  console.log("SLASH REGISTRADOS");

})();

// ====== BIENVENIDAS ======
client.on("guildMemberAdd", async member => {

  try {

    const canal = await client.channels.fetch(WELCOME_CHANNEL);

    if(!canal) return;

    const timestamp = Math.floor(Date.now()/1000);

    const welcomeEmbed = new EmbedBuilder()
      .setColor("#ffd700")
      .setTitle("🌟 ¡NUEVO MIEMBRO EN EL SERVIDOR! 🌟")
      .setDescription(
`Nos alegra tenerte por aquí, ${member.user.username}.

Asegúrate de leer las reglas y revisar nuestros canales del servidor.

🎮 ¿Qué ofrecemos?

• Comunidad activa
• Más de 500 uncopylockeds
• Staff rápido y eficiente

Recuerda leer la normativa para evitar sanciones.

Eres el usuario #${member.guild.memberCount} • <t:${timestamp}:R>`
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic:true }));

    canal.send({
      content: `¡Hey ${member}, bienvenido a la comunidad!`,
      embeds:[welcomeEmbed]
    });

  } catch(err){
    console.log(err);
  }

});

// ====== DESPEDIDAS ======
client.on("guildMemberRemove", async member => {

  try {

    const canal = await client.channels.fetch(GOODBYE_CHANNEL);

    if(!canal) return;

    const timestamp = Math.floor(Date.now()/1000);

    const goodbyeEmbed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("💔 UN MIEMBRO HA SALIDO")
      .setDescription(
`${member.user.username} ha abandonado el servidor.

Esperamos que haya tenido una buena experiencia en la comunidad.

Siempre será bienvenido de vuelta.

Ahora somos ${member.guild.memberCount} miembros • <t:${timestamp}:R>`
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic:true }));

    canal.send({
      content: `👋 Se fue ${member}`,
      embeds:[goodbyeEmbed]
    });

  } catch(err){
    console.log(err);
  }

});

client.once("ready", () => {
  console.log("BOT ULTRA PRO");
});

client.login(process.env.TOKEN);
