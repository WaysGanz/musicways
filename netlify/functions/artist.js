const adapt = require('../adapter');
exports.handler = adapt(require('../../api/artist.js'));
