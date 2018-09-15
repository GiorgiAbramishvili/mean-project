/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var CompanyInfos = require('./companyInfos.model');

exports.register = function(socket) {
  CompanyInfos.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  CompanyInfos.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('companyInfos:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('companyInfos:remove', doc);
}