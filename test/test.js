import test from 'ava';
import R from 'ramda';

import * as megahal from '../lib/megahal';

test('generate only possible sentence', t => {
  const data = [
    { words: ['i', 'spy', 'a', 'yellow'], canStart: true, canEnd: false, weight: 1 },
    { words: ['spy', 'a', 'yellow', 'bird'], canStart: false, canEnd: false, weight: 1 },
    { words: ['a', 'yellow', 'bird', 'with'], canStart: false, canEnd: false, weight: 1 },
    { words: ['yellow', 'bird', 'with', 'arthritis'], canStart: false, canEnd: true, weight: 1 },
  ];

  const adapter = {
    findRandomQuadStartingWith: words => data.find(quad => R.equals(words, R.take(3, quad.words))),
    findRandomQuadEndingWith: words => data.find(quad => R.equals(words, R.takeLast(3, quad.words))),
  };

  t.deepEqual(adapter.findRandomQuadStartingWith(['a', 'yellow', 'bird']), data[2]);

  const actual = megahal.generate(['spy', 'a', 'yellow', 'bird'], adapter);

  t.is(actual.join(' '), 'i spy a yellow bird with arthritis');
});

test('create brain from single sentence', t => {
  const expected = [
    { words: ['i', 'spy', 'a', 'yellow'], canStart: true, canEnd: false, weight: 1 },
    { words: ['spy', 'a', 'yellow', 'bird'], canStart: false, canEnd: false, weight: 1 },
    { words: ['a', 'yellow', 'bird', 'with'], canStart: false, canEnd: false, weight: 1 },
    { words: ['yellow', 'bird', 'with', 'arthritis'], canStart: false, canEnd: true, weight: 1 },
  ];

  const actual = megahal.createBrainFromSentences('i spy a yellow bird with arthritis');

  t.deepEqual(actual, expected);
});

test('create brain from multiple sentences (without overlap)', t => {
  const expected = [
    { words: ['i', 'spy', 'a', 'yellow'], canStart: true, canEnd: false, weight: 1 },
    { words: ['spy', 'a', 'yellow', 'bird'], canStart: false, canEnd: false, weight: 1 },
    { words: ['a', 'yellow', 'bird', 'with'], canStart: false, canEnd: false, weight: 1 },
    { words: ['yellow', 'bird', 'with', 'arthritis'], canStart: false, canEnd: true, weight: 1 },
    { words: ['its', 'life', 'sucked', 'pretty'], canStart: true, canEnd: false, weight: 1 },
    { words: ['life', 'sucked', 'pretty', 'bad'], canStart: false, canEnd: false, weight: 1 },
    { words: ['sucked', 'pretty', 'bad', 'tbh'], canStart: false, canEnd: true, weight: 1 },
  ];

  const actual = megahal.createBrainFromSentences('i spy a yellow bird with arthritis. its life sucked pretty bad tbh');

  t.deepEqual(actual, expected);
});

test('create brain from multiple sentences (with overlap)', t => {
  const expected = [
    { words: ['it', 'was', 'a', 'really'], canStart: true, canEnd: false, weight: 2 },
    { words: ['was', 'a', 'really', 'good'], canStart: false, canEnd: false, weight: 1 },
    { words: ['a', 'really', 'good', 'day'], canStart: false, canEnd: true, weight: 1 },
    { words: ['actually', 'no', 'it', 'was'], canStart: true, canEnd: false, weight: 1 },
    { words: ['no', 'it', 'was', 'a'], canStart: false, canEnd: false, weight: 1 },
    { words: ['was', 'a', 'really', 'terrible'], canStart: false, canEnd: false, weight: 1 },
    { words: ['a', 'really', 'terrible', 'day'], canStart: false, canEnd: true, weight: 1 },
  ];

  const actual = megahal.createBrainFromSentences('it was a really good day. actually no it was a really terrible day');

  t.deepEqual(actual, expected);
});
