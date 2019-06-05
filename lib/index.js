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
const msgpack = require('msgpack5');
const readDir = require('recursive-readdir');

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

  return levelup(encodingDown(downStore, { valueEncoding: msgpack() }), opts);
}

async function getOrDefault(db, key, defaultFn, opts) {
  try {
    return await db.get(key, opts);
  }
  catch(err) {
    if(err.notFound) {
      return await defaultFn();
    }
    throw err;
  }
}

async function main() {
  const db = setupLevel();

  if(Number(process.env.GENERATE)) {
    const alreadySeeded = await getOrDefault(db, 'brain-seeded', () => false);

    if(alreadySeeded && !Number(process.env.FORCE_GENERATE)) {
      console.log('Brain has already been seeded');
    }
    else {
      const seedFiles = await readDir(process.env.SEED_DATA_FOLDER || './seed-data');
      console.log(`Seed files: ${seedFiles.join(', ')}`);

      console.time('building brain');

      for(const file of seedFiles) {
        console.time(`building brain [${file}]`);

        const fileData = fs.readFileSync(file, { encoding: 'utf8' });

        await megahal.seedLevelBrainFromString(db, fileData);

        console.timeEnd(`building brain [${file}]`);
      }

      console.timeEnd('building brain');

      console.log('brain built...');

      await db.put('brain-seeded', true);
    }
  }

  // console.log(generateReply(db, ''));

  const excludedFromLearningChannelIds = process.env.EXCLUDED_FROM_LEARNING_CHANNELS.split(';');
  const excludedFromLearningUserIds = (process.env.EXCLUDED_FROM_LEARNING_USERS || '').split(';');
  const unprovokedChatterChannelIds = process.env.UNPROVOKED_CHATTER_CHANNELS.split(';');

  const client = new Discord.Client();

  await client.login(process.env.DISCORD_TOKEN);

  client.on('message', async msg => {
    if(msg.author.id === client.user.id) return;

    if(
      !excludedFromLearningChannelIds.includes(msg.channel.id) &&
      !excludedFromLearningUserIds.includes(msg.author.id)
    ) {
      await megahal.seedLevelBrainFromString(db, msg.cleanContent);
    }
  });

  client.on('message', async msg => {
    if(msg.author.id === client.user.id) return;

    if(
      msg.isMentioned(client.user) ||
      (
        unprovokedChatterChannelIds.includes(msg.channel.id) &&
        Math.random() < process.env.UNPROVOKED_CHATTER_CHANCE
      )
    ) {
      msg.channel.startTyping();
      try {
        const response = await generateReply(db, msg.cleanContent.replace(/@mythra/ig, ''));
      }
      finally {
        msg.channel.stopTyping();
      }
      await msg.channel.send(response);
    }
  });

  client.on('error', err => {
    console.error('Discord client error:', (err != null && err.stack != null) ? err.stack : err);
  });
}

main()
  .catch(err => console.error(err.stack));


// console.log(JSON.stringify(brain));
