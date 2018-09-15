/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var ManageCompany = require('./manageCompany.model');

exports.register = function(socket) {
  ManageCompany.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  ManageCompany.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('manageCompany:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('manageCompany:remove', doc);
}