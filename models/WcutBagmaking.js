const mongoose = require('mongoose');
const wcutBagmakingSchema = require('./schemas/wcutBagmaking.schema');

module.exports = mongoose.model('WcutBagmaking', wcutBagmakingSchema);