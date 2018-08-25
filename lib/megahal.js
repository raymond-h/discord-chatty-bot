const R = require('ramda');

const { sampleStream } = require('./util');

async function seedLevelBrainFromString(db, string) {
  const quadsLists = string
    .split(/\./ig)
    .map(sentence => sentence.trim())
    .filter(Boolean)
    .map(sentence => sentence.split(/[\s,\-'"]+/g))
    .map(words => words.filter(Boolean).map(word => word.toLowerCase()))
    .map(R.aperture(4));

  for(const quads of quadsLists) {
    const allOps = [];

    for(let i = 0; i < quads.length; i++) {
      const [a, b, c, d] = quads[i];

      const ops = [
        { type: 'put', key: `quad\x1F${a}\x1F${b}\x1F${c}\x1F${d}`, value: JSON.stringify(quads[i]) },
        { type: 'put', key: `next\x1F${a}\x1F${b}\x1F${c}\x1F${d}`, value: JSON.stringify({ word: d, canStart: i === 0, canEnd: i === quads.length - 1 }) },
        { type: 'put', key: `prev\x1F${b}\x1F${c}\x1F${d}\x1F${a}`, value: JSON.stringify({ word: a, canStart: i === 0, canEnd: i === quads.length - 1 }) }
      ];

      allOps.push(...ops);
    }

    await db.batch(allOps);
  }
}

function createLevelAdapter(db) {
  return {
    findRandomQuadStartingWith: async words => {
      const res_ = await sampleStream(db.createValueStream({
        gte: `next\x1F${words[0]}\x1F${words[1]}\x1F${words[2]}\x1F`,
        lte: `next\x1F${words[0]}\x1F${words[1]}\x1F${words[2]}\x1F\xFF`
      }));

      if(res_ == null) return null;

      const res = JSON.parse(res_);

      return {
        words: [words[0], words[1], words[2], res.word],
        canStart: res.canStart,
        canEnd: res.canEnd,
        weight: 1
      };
    },

    findRandomQuadEndingWith: async words => {
      const res_ = await sampleStream(db.createValueStream({
        gte: `prev\x1F${words[0]}\x1F${words[1]}\x1F${words[2]}\x1F`,
        lte: `prev\x1F${words[0]}\x1F${words[1]}\x1F${words[2]}\x1F\xFF`,
      }));

      if(res_ == null) return null;

      const res = JSON.parse(res_);

      return {
        words: [res.word, words[0], words[1], words[2]],
        canStart: res.canStart,
        canEnd: res.canEnd,
        weight: 1
      };
    }
  };
}

async function generateAsync(quad, { findRandomQuadStartingWith, findRandomQuadEndingWith }) {
  // start with random quad containing 'word'
  let output = quad;

  // add more words to end starting with last 3 words of quad until:
  //   reach quad with canEnd == true
  //   no more quads available to pick from
  let doneWithEnd = false;
  while(!doneWithEnd) {
    const nextQuad = await findRandomQuadStartingWith(R.takeLast(3, output));

    if(nextQuad == null) {
      doneWithEnd = true;
      break;
    }

    output = R.append(R.last(nextQuad.words), output);

    doneWithEnd = nextQuad.canEnd;
  }

  // add more words to start ending with first 3 words of quad until:
  //   reach quad with canStart == true
  //   no more quads available to pick from
  let doneWithStart = false;
  while(!doneWithStart) {
    const nextQuad = await findRandomQuadEndingWith(R.take(3, output));

    if(nextQuad == null) {
      doneWithStart = true;
      break;
    }

    output = R.prepend(R.head(nextQuad.words), output);

    doneWithEnd = nextQuad.canStart;
  }

  // return result as string (or maybe array)
  return output;
}

module.exports = { seedLevelBrainFromString, createLevelAdapter, generateAsync };
