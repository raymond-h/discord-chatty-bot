require('dotenv').config();

const fs = require('fs');

const Discord = require('discord.js');
const level = require('level');
// const levelMem = require('level-mem');

const megahal = require('./megahal');

const { sampleStream } = require('./util');

async function generateReply(db, string) {
  const startQuad = await sampleStream(db.createValueStream({
    gte: 'quad\x1F', lte: 'quad\x1F\xFF'
  }));

  const levelAdapter = megahal.createLevelAdapter(db);

  const response = await megahal.generateAsync(JSON.parse(startQuad), levelAdapter);

  return response.join(' ');
}

async function main() {
  // const db = levelMem();
  const db = level('./brain.db');

  // if(process.argv[2] === 'generate') {
  //   const file = fs.readFileSync('mobydick.txt', { encoding: 'utf8' });

  //   await megahal.seedLevelBrainFromString(db, file);

  //   console.log('brain built...');
  // }

  // console.log(generateReply(db, ''));

  const client = new Discord.Client();

  await client.login(process.env.DISCORD_TOKEN);

  client.on('message', async msg => {
    if(msg.author.id === client.user.id) return;

    await megahal.seedLevelBrainFromString(db, msg.cleanContent);

    if(!msg.isMentioned(client.user) && Math.random() >= process.env.UNPROVOKED_CHATTER_CHANCE) {
      return;
    }

    const response = await generateReply(db, msg.cleanContent);
    msg.channel.send(response);
  });
}

main()
  .catch(err => console.error(err.stack));


// console.log(JSON.stringify(brain));
