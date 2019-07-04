const R = require('ramda');
const getStream = require('get-stream');
const lexi = require('lexicographic-integer');

const sample = arr => arr[Math.floor(Math.random() * arr.length)];

const sampleStream = stream => getStream.array(stream).then(sample);

const randomId = () => {
  const n = Math.floor(Math.random() * 100000000);
  return lexi.pack(n, 'hex');
};

function cleanMessage(botName, msgStr) {
  return msgStr
    .replace(new RegExp('@' + botName, 'ig'), '')
    .replace(/\|\|.+?\|\|/ig, '[SPOILER]');
}

function replaceSpoilersWith(msgStr, fn) {
  return msgStr.replace(/\[SPOILER\]/ig, () => `||${fn()}||`);
}

async function replaceSpoilersWithAsync(msgStr, asyncFn) {
  const nonSpoilerParts = msgStr.split(/\[SPOILER\]/ig);
  const newSpoilers = await Promise.all(
    R.range(0, nonSpoilerParts.length - 1)
      .map(() => asyncFn().then(str => `||${str}||`))
  );
  return R.append(R.last(nonSpoilerParts), R.unnest(R.zip(nonSpoilerParts, newSpoilers))).join('');
}

module.exports = { sample, sampleStream, randomId, cleanMessage, replaceSpoilersWith, replaceSpoilersWithAsync };
