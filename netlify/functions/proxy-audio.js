const adapt = require('../adapter');
exports.handler = adapt(require('../../api/proxy-audio.js'));
