const R = require('ramda');

function createBrainFromSentences(sentencesStr) {
  const quads = sentencesStr
    .split(/\./ig)
    .map(sentence => sentence.trim())
    .filter(Boolean)
    .map(sentence => sentence.split(/[\s,\-'"]+/g))
    .map(words => words.filter(Boolean).map(word => word.toLowerCase()))
    .map(R.aperture(4));

  const otherQuads = R.unnest(
    quads
      .map(sentenceQuads =>
        sentenceQuads.map((quad, i) => ({
          words: quad,
          canStart: i === 0,
          canEnd: i === sentenceQuads.length - 1,
          weight: 1
        }))
      )
  );

  const groupedQuads = R.groupBy(quad => quad.words.join(','), otherQuads);

  const spec = {
    words: quad1 => quad1.words,
    weight: (quad1, quad2) => quad1.weight + quad2.weight,
    canStart: (quad1, quad2) => quad1.canStart || quad2.canStart,
    canEnd: (quad1, quad2) => quad1.canEnd || quad2.canEnd,
  };

  return R.values(groupedQuads)
    .map(quads => {
      return R.tail(quads).reduce(R.applySpec(spec), R.head(quads));
    });
}

function generate(quad, { findRandomQuadStartingWith, findRandomQuadEndingWith }) {
  // start with random quad containing 'word'
  let output = quad;

  // add more words to end starting with last 3 words of quad until:
  //   reach quad with canEnd == true
  //   no more quads available to pick from
  let doneWithEnd = false;
  while(!doneWithEnd) {
    const nextQuad = findRandomQuadStartingWith(R.takeLast(3, output));

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
    const nextQuad = findRandomQuadEndingWith(R.take(3, output));

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

module.exports = { createBrainFromSentences, generate };
