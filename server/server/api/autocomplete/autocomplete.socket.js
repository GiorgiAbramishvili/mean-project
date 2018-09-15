/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Autocomplete = require('./autocomplete.model');

exports.register = function(socket) {
  Autocomplete.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  Autocomplete.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('autocomplete:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('autocomplete:remove', doc);
}