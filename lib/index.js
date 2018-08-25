const fs = require('fs');

// const R = require('ramda');

const megahal = require('./megahal');

const file = fs.readFileSync('mobydick.txt', { encoding: 'utf8' });

const brain = megahal.createBrainFromSentences(file);

console.log('brain built...');

const sample = arr => arr[Math.floor(Math.random() * arr.length)];

const adapter = {
  findRandomQuadStartingWith: words =>
    sample(brain.filter(quad =>
      words[0] === quad.words[0] &&
      words[1] === quad.words[1] &&
      words[2] === quad.words[2]
    )),
  findRandomQuadEndingWith: words =>
    sample(brain.filter(quad =>
      words[0] === quad.words[1] &&
      words[1] === quad.words[2] &&
      words[2] === quad.words[3]
    )),
};

const response = megahal.generate(sample(brain).words, adapter);

console.log(response.join(' '));

// console.log(JSON.stringify(brain));
