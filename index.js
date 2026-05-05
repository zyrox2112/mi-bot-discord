const express = require("express");
const app = express();
app.get("/", (req, res) => res.send("Bot activo"));
app.listen(10000);

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

// ====== ECONOMÍA (memoria) ======
const eco = {};
function getBal(id){ if(!eco[id]) eco[id]={wallet:0,bank:0}; return eco[id]; }
function rnd(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

// ====== 100 COMANDOS ======
const categories = {
  "🛡 Moderación": ["ban","kick","mute","unmute","warn","warnings","clear","slowmode","lock","unlock","role","removerole","nickname","nuke","unban","timeout","untimeout","purge","announce","embed","poll","hidechannel","unhidechannel","lockdown","unlockdown"],
  "💰 Economía": ["balance","daily","work","rob","deposit","withdraw","transfer","shop","buy","sell","inventory","gamble","coin","slots","leaderboard","beg","crime","fish","mine","weekly"],
  "🎮 Diversión": ["coinflip","adivinar","8ball","dado","trivia","meme","chiste","iq","ship","hack","rate","love","kiss","slap","cry","laugh","dance","joke","rps","guessnumber","math","wouldyourather","avatarhack","insult","compliment"],
  "👤 Info": ["userinfo","serverinfo","avatar","banner","roles","membercount","botinfo","uptime","ping","channelinfo","roleinfo","servericon","joindate","badges","permissions"],
  "⚙️ Utilidad": ["help","say","embedbuilder","calculator","translate","remind","timer","afk","snipe","editmsg","shorten","qr","weather","timezone","notes"]
};

// ====== HELP ======
function generatePages(){
  const pages=[];
  for(const [cat,cmds] of Object.entries(categories)){
    const size=10;
    for(let i=0;i<cmds.length;i+=size){
      const slice=cmds.slice(i,i+size);
      pages.push(
        new EmbedBuilder()
          .setColor("#000000")
          .setTitle(`📜 ${cat}`)
          .setDescription(slice.map(c=>`➡️ n!${c}`).join("\n"))
      );
    }
  }
  return pages;
}

// ====== CORE (misma lógica para prefix y slash) ======
async function runCommand(ctx, name, args=[], opts={}){
  const isInteraction = !!ctx.isChatInputCommand;
  const user = isInteraction ? ctx.user : ctx.author;
  const member = isInteraction ? ctx.member : ctx.member;
  const channel = isInteraction ? ctx.channel : ctx.channel;
  const guild = isInteraction ? ctx.guild : ctx.guild;

  const reply = async (content)=>{
    if(isInteraction){
      if(ctx.replied || ctx.deferred) return ctx.followUp(content);
      return ctx.reply(content);
    } else {
      return channel.send(content);
    }
  };

  const me = getBal(user.id);

  // ===== HELP =====
  if(name==="help"){
    const pages=generatePages(); let page=0;
    const row=new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("prev").setLabel("⬅️").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("next").setLabel("➡️").setStyle(ButtonStyle.Primary)
    );
    const msg = await (isInteraction
      ? ctx.reply({embeds:[pages[page]],components:[row],fetchReply:true})
      : channel.send({embeds:[pages[page]],components:[row]})
    );
    const col = msg.createMessageComponentCollector({time:60000});
    col.on("collect", async (i)=>{
      if(i.user.id!==user.id) return;
      page = i.customId==="next" ? (page+1)%pages.length : (page-1+pages.length)%pages.length;
      await i.update({embeds:[pages[page]]});
    });
    return;
  }

  // ===== UTILIDAD =====
  if(name==="ping") return reply("🏓 Pong");
  if(name==="say"){
    const text = isInteraction ? ctx.options.getString("texto") : args.join(" ");
    if(!text) return;
    if(!isInteraction) await ctx.delete().catch(()=>{});
    return reply(text);
  }
  if(name==="calculator"||name==="math"){
    try{ return reply(String(eval((isInteraction? ctx.options.getString("expr") : args.join(" ")) || ""))); }
    catch{ return reply("Error"); }
  }
  if(name==="translate") return reply("Traducción básica (placeholder)");
  if(name==="timer"){
    const s = Number(isInteraction? ctx.options.getInteger("segundos") : (args[0]||"5"));
    setTimeout(()=> reply("⏰ listo"), s*1000);
    return reply(`Timer ${s}s`);
  }
  if(name==="remind"){
    const s = Number(isInteraction? ctx.options.getInteger("segundos") : (args[0]||"5"));
    const txt = isInteraction? (ctx.options.getString("texto")||"recordatorio") : (args.slice(1).join(" ")||"recordatorio");
    setTimeout(()=> user.send(`🔔 ${txt}`).catch(()=>{}), s*1000);
    return reply("Te aviso por DM");
  }
  if(name==="afk") return reply("Te marcaste AFK");
  if(name==="snipe") return reply("Nada que snipear");
  if(name==="editmsg") return reply("No implementado");
  if(name==="shorten") return reply("URL corta (placeholder)");
  if(name==="qr") return reply("QR (placeholder)");
  if(name==="weather") return reply("Clima (placeholder)");
  if(name==="timezone") return reply(new Date().toLocaleString());
  if(name==="notes") return reply("Notas (placeholder)");
  if(name==="embedbuilder"){
    const text = isInteraction ? ctx.options.getString("texto") : args.join(" ");
    const e = new EmbedBuilder().setColor("#000000").setDescription(text||"");
    return isInteraction ? ctx.reply({embeds:[e]}) : channel.send({embeds:[e]});
  }

  // ===== INFO =====
  if(name==="userinfo"){
    const u = isInteraction ? (ctx.options.getUser("usuario")||user) : (ctx.mentions.users.first()||user);
    return reply(u.tag);
  }
  if(name==="serverinfo") return reply(guild.name);
  if(name==="avatar"){
    const u = isInteraction ? (ctx.options.getUser("usuario")||user) : (ctx.mentions.users.first()||user);
    return reply(u.displayAvatarURL());
  }
  if(name==="banner") return reply("Banner (placeholder)");
  if(name==="roles") return reply(guild.roles.cache.map(r=>r.name).join(", "));
  if(name==="membercount") return reply(String(guild.memberCount));
  if(name==="botinfo") return reply(`Servers: ${client.guilds.cache.size}`);
  if(name==="uptime") return reply(`${Math.floor(process.uptime())}s`);
  if(name==="channelinfo") return reply(channel.name);
  if(name==="roleinfo") return reply("Role info (placeholder)");
  if(name==="servericon") return reply(guild.iconURL());
  if(name==="joindate") return reply(member.joinedAt.toDateString());
  if(name==="badges") return reply("Badges (placeholder)");
  if(name==="permissions") return reply(member.permissions.toArray().join(", "));

  // ===== DIVERSIÓN =====
  if(name==="coinflip") return reply(Math.random()<0.5?"Cara":"Cruz");
  if(name==="adivinar"){ const c=["Rojo","Azul","Verde","Negro","Blanco"]; return reply(c[rnd(0,c.length-1)]); }
  if(name==="8ball"){ const r=["Sí","No","Tal vez","Claro","Nunca"]; return reply(r[rnd(0,r.length-1)]); }
  if(name==="dado") return reply(String(rnd(1,6)));
  if(name==="trivia") return reply("Trivia (placeholder)");
  if(name==="meme") return reply("Meme (placeholder)");
  if(name==="chiste") return reply("Chiste (placeholder)");
  if(name==="iq") return reply(`${rnd(80,140)} IQ`);
  if(name==="ship") return reply(`Compatibilidad: ${rnd(0,100)}%`);
  if(name==="hack") return reply("Hacked (fake)");
  if(name==="rate") return reply(`${rnd(1,10)}/10`);
  if(name==="love") return reply(`❤️ ${rnd(0,100)}%`);
  if(["kiss","slap","cry","laugh","dance","joke"].includes(name)) return reply("😂");
  if(name==="rps"){ const o=["piedra","papel","tijera"]; return reply(o[rnd(0,2)]); }
  if(name==="guessnumber") return reply(`Número: ${rnd(1,100)}`);
  if(name==="wouldyourather") return reply("¿A o B?");
  if(name==="avatarhack") return reply("Fake avatar hack");
  if(name==="insult") return reply("Insulto suave");
  if(name==="compliment") return reply("Eres pro");

  // ===== ECONOMÍA =====
  if(name==="balance") return reply(`💰 ${me.wallet} | 🏦 ${me.bank}`);
  if(name==="daily"){ me.wallet+=100; return reply("+100"); }
  if(name==="weekly"){ me.wallet+=500; return reply("+500"); }
  if(name==="work"){ const g=rnd(50,150); me.wallet+=g; return reply(`+${g}`); }
  if(name==="beg"){ const g=rnd(1,30); me.wallet+=g; return reply(`+${g}`); }
  if(name==="crime"){ const g=rnd(-100,200); me.wallet+=g; return reply(`${g>=0?"+":""}${g}`); }
  if(name==="fish"||name==="mine"){ const g=rnd(20,120); me.wallet+=g; return reply(`+${g}`); }
  if(name==="deposit"){
    const n = Number(isInteraction? ctx.options.getInteger("cantidad") : (args[0]||0));
    if(me.wallet<n) return reply("No");
    me.wallet-=n; me.bank+=n; return reply("OK");
  }
  if(name==="withdraw"){
    const n = Number(isInteraction? ctx.options.getInteger("cantidad") : (args[0]||0));
    if(me.bank<n) return reply("No");
    me.bank-=n; me.wallet+=n; return reply("OK");
  }
  if(name==="transfer"){
    const u = isInteraction ? ctx.options.getUser("usuario") : (ctx.mentions.users.first());
    const n = Number(isInteraction? ctx.options.getInteger("cantidad") : (args[1]||0));
    if(!u) return;
    const to=getBal(u.id);
    if(me.wallet<n) return;
    me.wallet-=n; to.wallet+=n; return reply("Enviado");
  }
  if(name==="rob"){
    const u = isInteraction ? ctx.options.getUser("usuario") : (ctx.mentions.users.first());
    if(!u) return;
    const to=getBal(u.id);
    const g=rnd(-50,150);
    if(g>0){ me.wallet+=g; to.wallet=Math.max(0,to.wallet-g); }
    else me.wallet+=g;
    return reply(`${g>=0?"+":""}${g}`);
  }
  if(["gamble","coin","slots"].includes(name)){
    const n = Number(isInteraction? ctx.options.getInteger("cantidad") : (args[0]||10));
    if(me.wallet<n) return;
    const win=Math.random()<0.5;
    me.wallet+= win? n : -n;
    return reply(win?`Ganaste ${n}`:`Perdiste ${n}`);
  }
  if(["shop","buy","sell","inventory","leaderboard"].includes(name)) return reply("Sistema simple (placeholder)");

  // ===== MODERACIÓN =====
  if(name==="ban"){
    if(!member.permissions.has(PermissionsBitField.Flags.BanMembers)) return;
    const u = isInteraction ? ctx.options.getUser("usuario") : (ctx.mentions.users.first());
    if(!u) return;
    const gm = guild.members.cache.get(u.id);
    await gm?.ban().catch(()=>{});
    return reply("Baneado");
  }
  if(name==="kick"){
    if(!member.permissions.has(PermissionsBitField.Flags.KickMembers)) return;
    const u = isInteraction ? ctx.options.getUser("usuario") : (ctx.mentions.users.first());
    if(!u) return;
    const gm = guild.members.cache.get(u.id);
    await gm?.kick().catch(()=>{});
    return reply("Kick");
  }
  if(name==="mute"||name==="unmute") return reply("Usa roles (placeholder)");
  if(name==="warn") return reply("Warn (placeholder)");
  if(name==="warnings") return reply("Warnings (placeholder)");
  if(name==="clear"||name==="purge"){
    const n = Number(isInteraction? ctx.options.getInteger("cantidad") : (args[0]||5));
    await channel.bulkDelete(n).catch(()=>{});
    return;
  }
  if(name==="slowmode"){
    const s = Number(isInteraction? ctx.options.getInteger("segundos") : (args[0]||0));
    await channel.setRateLimitPerUser(s).catch(()=>{});
    return reply("OK");
  }
  if(name==="lock"){
    await channel.permissionOverwrites.edit(guild.roles.everyone,{SendMessages:false});
    return reply("🔒");
  }
  if(name==="unlock"){
    await channel.permissionOverwrites.edit(guild.roles.everyone,{SendMessages:true});
    return reply("🔓");
  }
  if(name==="role"){
    const u = isInteraction ? ctx.options.getUser("usuario") : (ctx.mentions.users.first());
    const r = isInteraction ? ctx.options.getRole("rol") : (ctx.mentions.roles.first());
    if(!u||!r) return;
    const gm = guild.members.cache.get(u.id);
    await gm?.roles.add(r).catch(()=>{});
    return reply("Rol agregado");
  }
  if(name==="removerole"){
    const u = isInteraction ? ctx.options.getUser("usuario") : (ctx.mentions.users.first());
    const r = isInteraction ? ctx.options.getRole("rol") : (ctx.mentions.roles.first());
    if(!u||!r) return;
    const gm = guild.members.cache.get(u.id);
    await gm?.roles.remove(r).catch(()=>{});
    return reply("Rol quitado");
  }
  if(name==="nickname"){
    const u = isInteraction ? ctx.options.getUser("usuario") : (ctx.mentions.users.first());
    const newName = isInteraction ? (ctx.options.getString("nombre")||"") : args.slice(1).join(" ");
    if(!u) return;
    const gm = guild.members.cache.get(u.id);
    await gm?.setNickname(newName).catch(()=>{});
    return reply("Nick");
  }
  if(name==="nuke"){
    const c = await channel.clone();
    await channel.delete();
    return c.send("💣");
  }
  if(name==="unban") return reply("Unban (placeholder)");
  if(name==="timeout"||name==="untimeout") return reply("Timeout (placeholder)");
  if(name==="announce") return channel.send(`📢 ${isInteraction? (ctx.options.getString("texto")||"") : args.join(" ")}`);
  if(name==="embed"){
    const e=new EmbedBuilder().setDescription(isInteraction? (ctx.options.getString("texto")||"") : args.join(" "));
    return channel.send({embeds:[e]});
  }
  if(name==="poll"){
    const q = isInteraction? (ctx.options.getString("pregunta")||"") : args.join(" ");
    const msg=await channel.send(`📊 ${q}`);
    await msg.react("👍"); await msg.react("👎");
    return;
  }
  if(name==="hidechannel"){
    await channel.permissionOverwrites.edit(guild.roles.everyone,{ViewChannel:false});
    return reply("Oculto");
  }
  if(name==="unhidechannel"){
    await channel.permissionOverwrites.edit(guild.roles.everyone,{ViewChannel:true});
    return reply("Visible");
  }
  if(name==="lockdown"||name==="unlockdown") return reply("Lockdown (placeholder)");
}

// ====== PREFIX ======
client.on("messageCreate", async (m)=>{
  if(!m.guild || m.author.bot || !m.content.startsWith(prefix)) return;
  const args = m.content.slice(prefix.length).trim().split(/ +/);
  const name = args.shift().toLowerCase();
  return runCommand(m, name, args);
});

// ====== SLASH BUILD ======
const slash = [];
for(const list of Object.values(categories)){
  for(const name of list){
    const b = new SlashCommandBuilder().setName(name).setDescription(`Comando ${name}`);

    // opciones comunes
    if(name==="say"||name==="embedbuilder"||name==="announce")
      b.addStringOption(o=>o.setName("texto").setDescription("Texto").setRequired(true));

    if(name==="8ball")
      b.addStringOption(o=>o.setName("pregunta").setDescription("Pregunta").setRequired(true));

    if(name==="poll")
      b.addStringOption(o=>o.setName("pregunta").setDescription("Pregunta").setRequired(true));

    if(["deposit","withdraw","gamble","coin","slots","transfer"].includes(name))
      b.addIntegerOption(o=>o.setName("cantidad").setDescription("Cantidad").setRequired(true));

    if(["timer","remind","slowmode"].includes(name))
      b.addIntegerOption(o=>o.setName("segundos").setDescription("Segundos").setRequired(true));

    if(["ban","kick","role","removerole","nickname","transfer","rob"].includes(name))
      b.addUserOption(o=>o.setName("usuario").setDescription("Usuario").setRequired(true));

    if(["role","removerole"].includes(name))
      b.addRoleOption(o=>o.setName("rol").setDescription("Rol").setRequired(true));

    if(name==="nickname")
      b.addStringOption(o=>o.setName("nombre").setDescription("Nuevo nombre").setRequired(true));

    if(["calculator","math"].includes(name))
      b.addStringOption(o=>o.setName("expr").setDescription("Expresión").setRequired(true));

    if(["userinfo","avatar"].includes(name))
      b.addUserOption(o=>o.setName("usuario").setDescription("Usuario").setRequired(false));

    slash.push(b.toJSON());
  }
}

// ====== REGISTER SLASH ======
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
(async ()=>{
  try{
    await rest.put(Routes.applicationCommands("1500615147293769808"), { body: slash });
    console.log("Slash registrados");
  }catch(e){ console.log(e); }
})();

// ====== INTERACTIONS ======
client.on("interactionCreate", async (i)=>{
  if(!i.isChatInputCommand()) return;
  return runCommand(i, i.commandName, []);
});

// ====== READY ======
client.on("ready", ()=> console.log("Bot listo"));

client.login(process.env.TOKEN);
