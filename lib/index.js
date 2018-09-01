require('dotenv').config();

const fs = require('fs');

const Discord = require('discord.js');

const levelup = require('levelup');
const leveldown = require('leveldown');
const encodingDown = require('encoding-down');
const memdown = require('memdown');
const mongodown = require('mongodown');
const redisdown = require('redisdown');
const redisUrl = require('redis-url');

const megahal = require('./megahal');

const { sample } = require('./util');

async function generateReply(db, string) {
  const baseWord = sample(string.split(/\s+/g).filter(Boolean));

  let startQuad;
  if(baseWord != null) {
    startQuad = await megahal.sampleQuad(db, `initial-quads\x1F${baseWord.toLowerCase()}`);
  }

  if(startQuad == null) {
    startQuad = await megahal.sampleQuad(db, 'quads');
  }

  const levelAdapter = megahal.createLevelAdapter(db);

  const response = await megahal.generateAsync(startQuad, levelAdapter);

  return response.join(' ');
}

function setupLevel() {
  let downStore;
  let opts = {};
  if(Number(process.env.IN_MEMORY)) {
    console.log('Database: in-memory');
    downStore = memdown();
  }
  else if(process.env.MONGO_URL) {
    console.log('Database: MongoDB');
    downStore = mongodown(process.env.MONGO_URL);
  }
  else if(process.env.REDIS_URL) {
    console.log('Database: Redis');
    downStore = redisdown('brain');
    opts = { redis: redisUrl.connect() };
  }
  else {
    console.log('Database: LevelDB');
    downStore = leveldown(process.env.LEVEL_LOCATION || './brain.db');
  }

  return levelup(encodingDown(downStore, { valueEncoding: 'json' }), opts);
}

async function main() {
  const db = setupLevel();

  if(process.argv[2] === 'generate') {
    console.time('building brain');
    console.time('building brain [mobydick.txt]');

    const file = fs.readFileSync('mobydick.txt', { encoding: 'utf8' });

    await megahal.seedLevelBrainFromString(db, file);

    console.timeEnd('building brain [mobydick.txt]');
    console.time('building brain [chatlog.txt]');
    console.log('Done with moby dick...');

    const chatlog = fs.readFileSync('chatlog.txt', { encoding: 'utf8' });

    await megahal.seedLevelBrainFromString(db, chatlog);

    console.timeEnd('building brain [chatlog.txt]');
    console.timeEnd('building brain');
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
      const response = await generateReply(db, msg.cleanContent.replace(/@mythra/ig, ''));
      msg.channel.send(response);
    }
  });
}

main()
  .catch(err => console.error(err.stack));


// console.log(JSON.stringify(brain));
