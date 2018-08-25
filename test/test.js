import test from 'ava';
import R from 'ramda';

import * as megahal from '../lib/megahal';

test('generate only possible sentence', async t => {
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

  const actual = await megahal.generateAsync(['spy', 'a', 'yellow', 'bird'], adapter);

  t.is(actual.join(' '), 'i spy a yellow bird with arthritis');
});
