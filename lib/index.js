const fs = require('fs');

const level = require('level');
// const levelMem = require('level-mem');

const megahal = require('./megahal');

const { sampleStream } = require('./util');

async function main() {
  const file = fs.readFileSync('mobydick.txt', { encoding: 'utf8' });
  // const db = levelMem();
  const db = level('./brain.db');

  if(process.argv[2] === 'generate') {
    await megahal.seedLevelBrainFromString(db, file);

    console.log('brain built...');
  }

  const startQuad = await sampleStream(db.createValueStream({
    gte: 'quad\x1F', lte: 'quad\x1F\xFF'
  }));

  const levelAdapter = megahal.createLevelAdapter(db);

  const response = await megahal.generateAsync(JSON.parse(startQuad), levelAdapter);

  console.log(response.join(' '));
}

main()
  .catch(err => console.error(err.stack));


// console.log(JSON.stringify(brain));
