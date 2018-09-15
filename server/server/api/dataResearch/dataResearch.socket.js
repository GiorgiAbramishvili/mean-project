/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var DataResearch = require('./dataResearch.model');

exports.register = function(socket) {
  DataResearch.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  DataResearch.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('dataResearch:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('dataResearch:remove', doc);
}