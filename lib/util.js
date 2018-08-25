const getStream = require('get-stream');

const sample = arr => arr[Math.floor(Math.random() * arr.length)];

const sampleStream = stream => getStream.array(stream).then(sample);

module.exports = { sample, sampleStream };
