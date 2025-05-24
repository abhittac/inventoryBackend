const mongoose = require('mongoose');
const dcutBagmakingSchema = require('./schemas/dcutBagmaking.schema');

module.exports = mongoose.model('DcutBagmaking', dcutBagmakingSchema);