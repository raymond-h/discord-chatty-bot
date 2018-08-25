require('dotenv').config();

const fs = require('fs');

const Discord = require('discord.js');
const level = require('level');
// const levelMem = require('level-mem');

const megahal = require('./megahal');

const { sample } = require('./util');

async function generateReply(db, string) {
  const baseWord = sample(string.split(/\s+/g)).toLowerCase();

  let startQuadStr = await megahal.sampleQuad(db, `initial-quads\x1F${baseWord}`);

  if(startQuadStr == null) {
    startQuadStr = await megahal.sampleQuad(db, 'quads');
  }

  const startQuad = JSON.parse(startQuadStr);

  const levelAdapter = megahal.createLevelAdapter(db);

  const response = await megahal.generateAsync(startQuad, levelAdapter);

  return response.join(' ');
}

async function main() {
  // const db = levelMem();
  const db = level('./brain.db');

  if(process.argv[2] === 'generate') {
    const file = fs.readFileSync('mobydick.txt', { encoding: 'utf8' });

    await megahal.seedLevelBrainFromString(db, file);

    console.log('brain built...');
  }

  // console.log(generateReply(db, ''));

  const excludedFromLearningChannelIds = process.env.EXCLUDED_FROM_LEARNING_CHANNELS.split(';');
  const unprovokedChatterChannelIds = process.env.UNPROVOKED_CHATTER_CHANNELS.split(';');

  const client = new Discord.Client();

  await client.login(process.env.DISCORD_TOKEN);

  client.on('message', async msg => {
    if(msg.author.id === client.user.id) return;

    if(!excludedFromLearningChannelIds.includes(msg.channel.id)) {
      // we actually don't wait to wait for this
      megahal.seedLevelBrainFromString(db, msg.cleanContent);
    }

    if(
      msg.isMentioned(client.user) ||
      (
        unprovokedChatterChannelIds.includes(msg.channel.id) &&
        Math.random() < process.env.UNPROVOKED_CHATTER_CHANCE
      )
    ) {
      const response = await generateReply(db, msg.cleanContent);
      msg.channel.send(response);
    }
  });
}

main()
  .catch(err => console.error(err.stack));


// console.log(JSON.stringify(brain));
