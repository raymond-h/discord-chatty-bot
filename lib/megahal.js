const R = require('ramda');

const { sampleStream, randomId } = require('./util');

async function seedLevelBrainFromString(db, string) {
  const quadsLists = string
    .split(/[.!?\n]/ig)
    .map(sentence => sentence.trim())
    .filter(Boolean)
    .map(sentence => sentence.split(/[\s,\-'"]+/g))
    .map(words => words.filter(Boolean).map(word => word.toLowerCase()))
    .map(R.aperture(4));

  let allOps = [];
  for(const quads of quadsLists) {

    for(let i = 0; i < quads.length; i++) {
      const [a, b, c, d] = quads[i];

      allOps.push(
        { type: 'put', key: `quads\x1F${randomId()}`, value: quads[i] },
        { type: 'put', key: 'quads\xFF', value: quads[i] },
        { type: 'put', key: `initial-quads\x1F${a}\x1F${randomId()}`, value: quads[i] },
        { type: 'put', key: `initial-quads\x1F${b}\x1F${randomId()}`, value: quads[i] },
        { type: 'put', key: `initial-quads\x1F${c}\x1F${randomId()}`, value: quads[i] },
        { type: 'put', key: `initial-quads\x1F${d}\x1F${randomId()}`, value: quads[i] },
        { type: 'put', key: `next\x1F${a}\x1F${b}\x1F${c}\x1F${d}`, value: { word: d, canStart: i === 0, canEnd: i === quads.length - 1 } },
        { type: 'put', key: `prev\x1F${b}\x1F${c}\x1F${d}\x1F${a}`, value: { word: a, canStart: i === 0, canEnd: i === quads.length - 1 } }
      );
    }

    if(allOps.length >= 200000) {
      console.log(`Writing batch (${allOps.length} ops)...`);
      await db.batch(allOps);
      allOps = [];
    }
  }

  console.log(`Writing last batch (${allOps.length} ops)...`);
  await db.batch(allOps);
}

async function sampleQuad(db, baseKey) {
  return await sampleStream(
    db.createValueStream({
      limit: 1,
      gte: `${baseKey}\x1F${randomId()}`,
      lte: `${baseKey}\xFF`,
    })
  );
}

function createLevelAdapter(db) {
  return {
    findRandomQuadStartingWith: async (a, b, c) => {
      const res = await sampleStream(db.createValueStream({
        gte: `next\x1F${a}\x1F${b}\x1F${c}\x1F`,
        lte: `next\x1F${a}\x1F${b}\x1F${c}\x1F\xFF`
      }));

      if(res == null) return null;

      return {
        words: [a, b, c, res.word],
        canStart: res.canStart,
        canEnd: res.canEnd,
        weight: 1
      };
    },

    findRandomQuadEndingWith: async (a, b, c) => {
      const res = await sampleStream(db.createValueStream({
        gte: `prev\x1F${a}\x1F${b}\x1F${c}\x1F`,
        lte: `prev\x1F${a}\x1F${b}\x1F${c}\x1F\xFF`,
      }));

      if(res == null) return null;

      return {
        words: [res.word, a, b, c],
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
    const nextQuad = await findRandomQuadStartingWith(
      output[output.length-3], output[output.length-2], output[output.length-1]
    );

    if(nextQuad == null) {
      doneWithEnd = true;
      break;
    }

    output = R.append(R.last(nextQuad.words), output);

    if(nextQuad.canEnd && Math.random() < 0.3) {
      doneWithEnd = true;
    }
  }

  // add more words to start ending with first 3 words of quad until:
  //   reach quad with canStart == true
  //   no more quads available to pick from
  let doneWithStart = false;
  while(!doneWithStart) {
    const nextQuad = await findRandomQuadEndingWith(output[0], output[1], output[2]);

    if(nextQuad == null) {
      doneWithStart = true;
      break;
    }

    output = R.prepend(R.head(nextQuad.words), output);

    // doneWithStart = nextQuad.canStart;
    if(nextQuad.canStart && Math.random() < 0.3) {
      doneWithStart = true;
    }
  }

  // return result as string (or maybe array)
  return output;
}

module.exports = { seedLevelBrainFromString, sampleQuad, createLevelAdapter, generateAsync };
