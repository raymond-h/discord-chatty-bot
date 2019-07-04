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

module.exports = { sample, sampleStream, randomId, cleanMessage };
