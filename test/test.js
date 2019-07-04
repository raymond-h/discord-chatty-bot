import test from 'ava';
import R from 'ramda';

import * as megahal from '../lib/megahal';
import * as util from '../lib/util';

test('generate only possible sentence', async t => {
  const data = [
    { words: ['i', 'spy', 'a', 'yellow'], canStart: true, canEnd: false, weight: 1 },
    { words: ['spy', 'a', 'yellow', 'bird'], canStart: false, canEnd: false, weight: 1 },
    { words: ['a', 'yellow', 'bird', 'with'], canStart: false, canEnd: false, weight: 1 },
    { words: ['yellow', 'bird', 'with', 'arthritis'], canStart: false, canEnd: true, weight: 1 },
  ];

  const adapter = {
    findRandomQuadStartingWith: (...words) =>
      data.find(quad =>
        R.equals(words, R.take(3, quad.words))
      ),

    findRandomQuadEndingWith: (...words) =>
      data.find(quad =>
        R.equals(words, R.takeLast(3, quad.words))
      ),
  };

  t.deepEqual(adapter.findRandomQuadStartingWith(...['a', 'yellow', 'bird']), data[2]);

  const actual = await megahal.generateAsync(['spy', 'a', 'yellow', 'bird'], adapter);

  t.is(actual.join(' '), 'i spy a yellow bird with arthritis');
});

test('clean message removes bot mention', t => {
  t.deepEqual(util.cleanMessage('botname', '@botname hello world').trim(), 'hello world');
});

test('clean message replaces spoilers', t => {
  t.deepEqual(util.cleanMessage('unused', 'hello world ||this is a spoiler|| cool fact huh').trim(), 'hello world [SPOILER] cool fact huh');
});

test('replaceSpoilersWith', t => {
  const strings = ['ayy', 'bee', 'cee'];
  let i = 0;
  const replaceFn = () => {
    return strings[i++];
  };

  t.deepEqual(
    util.replaceSpoilersWith('hello world [SPOILER] cool [SPOILER][SPOILER] huh', replaceFn).trim(),
    'hello world ||ayy|| cool ||bee||||cee|| huh'
  );
  t.is(i, 3); // how many times replaceFn was called
});

test('replaceSpoilersWith async vs sync', async t => {
  const strings = ['ayy', 'bee', 'cee'];
  let i = 0;
  const replaceFn = () => {
    return strings[i++];
  };
  let j = 0;
  const asyncReplaceFn = async () => {
    return strings[j++];
  };

  t.deepEqual(
    await util.replaceSpoilersWithAsync('hello world [SPOILER] cool [SPOILER][SPOILER] huh', asyncReplaceFn),
    util.replaceSpoilersWith('hello world [SPOILER] cool [SPOILER][SPOILER] huh', replaceFn)
  );
  t.is(i, 3); // how many times replaceFn was called
  t.is(j, 3); // how many times asyncReplaceFn was called
});
