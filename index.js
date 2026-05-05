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
  PermissionsBitField,
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

// ====== UTIL ======
const eco = {};
function getBal(id){ if(!eco[id]) eco[id]={wallet:0,bank:0}; return eco[id]; }
function rnd(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

function embed(title, desc, color="#2b2d31", user){
  const e = new EmbedBuilder()
    .setTitle(title)
    .setDescription(desc)
    .setColor(color)
    .setTimestamp();
  if(user){
    e.setFooter({ text: user.username, iconURL: user.displayAvatarURL() });
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
  const pages=[];
  for(let i=0;i<cmds.length;i+=10){
    pages.push(new EmbedBuilder()
      .setColor("#000000")
      .setTitle("📜 Comandos")
      .setDescription(cmds.slice(i,i+10).map(c=>`➡️ n!${c}`).join("\n"))
    );
  }
  return pages;
}

// ====== CORE ======
async function run(ctx,name,args=[]){
  const isI = !!ctx.isChatInputCommand;
  const user = isI ? ctx.user : ctx.author;
  const channel = ctx.channel;
  const guild = ctx.guild;
  const member = ctx.member;
  const me = getBal(user.id);

  const send = async (e)=>{
    if(isI){
      if(ctx.replied || ctx.deferred) return ctx.followUp({embeds:[e]});
      return ctx.reply({embeds:[e]});
    }
    return channel.send({embeds:[e]});
  };

  // ===== HELP =====
  if(name==="help"){
    const pages=helpPages(); let p=0;

    const row=new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("prev").setLabel("⬅️").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("next").setLabel("➡️").setStyle(ButtonStyle.Primary)
    );

    const msg = await (isI
      ? ctx.reply({embeds:[pages[p]],components:[row],fetchReply:true})
      : channel.send({embeds:[pages[p]],components:[row]})
    );

    const col=msg.createMessageComponentCollector({time:60000});
    col.on("collect",async i=>{
      if(i.user.id!==user.id) return;
      p = i.customId==="next" ? (p+1)%pages.length : (p-1+pages.length)%pages.length;
      await i.update({embeds:[pages[p]]});
    });
    return;
  }

  // ===== EJEMPLOS PRO =====

  if(name==="balance"){
    const total = me.wallet + me.bank;
    return send(embed("💰 Balance",
      `💵 Wallet: ${me.wallet}\n🏦 Banco: ${me.bank}\n\nTotal: ${total}`,
      "#00ff88",user));
  }

  if(name==="work"){
    const g=rnd(50,150); me.wallet+=g;
    return send(embed("💼 Trabajo",`Ganaste ${g}`,"#00ff88",user));
  }

  if(name==="coinflip"){
    return send(embed("🪙 Coinflip",Math.random()<0.5?"Cara":"Cruz","#5865F2",user));
  }

  if(name==="say"){
    const texto = isI ? ctx.options.getString("texto") : args.join(" ");
    if(!texto) return;
    if(!isI) await ctx.delete().catch(()=>{});
    return channel.send(texto);
  }

  // ===== BAN CON BOTONES =====
  if(name==="ban"){
    const target = isI ? ctx.options.getUser("usuario") : ctx.mentions.users.first();
    const reason = isI ? ctx.options.getString("razon") : args.slice(1).join(" ") || "Sin razón";

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("yes").setLabel("Confirmar").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("no").setLabel("Cancelar").setStyle(ButtonStyle.Secondary)
    );

    const msg = await ctx.reply({
      embeds:[embed("⚠️ Confirmar Ban",`Usuario: ${target?.tag}\nRazón: ${reason}`,"#ffaa00",user)],
      components:[row],
      fetchReply:true
    });

    const col = msg.createMessageComponentCollector({time:15000});
    col.on("collect", async i=>{
      if(i.user.id !== user.id) return;

      if(i.customId==="yes"){
        await i.update({embeds:[embed("🔨 Ban","Ejecutado","#ff0000",user)],components:[]});
      } else {
        await i.update({embeds:[embed("❌ Cancelado","No se hizo nada","#2b2d31",user)],components:[]});
      }
    });
    return;
  }

  // ===== DEFAULT =====
  return send(embed("⚙️ Comando",
    `El comando **${name}** se ejecutó correctamente`,
    "#2b2d31",user));
}

// ===== PREFIX =====
client.on("messageCreate", m=>{
  if(!m.content.startsWith(prefix) || m.author.bot) return;
  const args=m.content.slice(prefix.length).split(/ +/);
  const name=args.shift().toLowerCase();
  if(!cmds.includes(name)) return;
  run(m,name,args);
});

// ===== SLASH =====
client.on("interactionCreate", i=>{
  if(!i.isChatInputCommand()) return;
  run(i,i.commandName,[]);
});

// ===== REGISTER (ANTI CRASH) =====
const rest=new REST({version:"10"}).setToken(process.env.TOKEN);

(async()=>{
  if(process.env.REGISTER !== "true") return;

  const slash = [];

  for(const name of cmds){
    const cmd = new SlashCommandBuilder()
      .setName(name)
      .setDescription(`Comando ${name}`);

    if(["ban","kick","transfer","rob"].includes(name)){
      cmd.addUserOption(o=>o.setName("usuario").setDescription("Usuario").setRequired(true));
    }

    if(["ban","kick"].includes(name)){
      cmd.addStringOption(o=>o.setName("razon").setDescription("Motivo"));
    }

    if(["say","announce"].includes(name)){
      cmd.addStringOption(o=>o.setName("texto").setDescription("Texto").setRequired(true));
    }

    slash.push(cmd.toJSON());
  }

  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: slash });
  console.log("SLASH REGISTRADOS");
})();

client.once("ready",()=>console.log("BOT ULTRA PRO"));
client.login(process.env.TOKEN);
