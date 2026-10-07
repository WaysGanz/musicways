const adapt = require('../adapter');
exports.handler = adapt(require('../../api/ytplay.js'));
