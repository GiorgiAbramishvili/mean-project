'use strict';


var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var CompanySchema = new Schema({
  SIRET: String,
  SIREN: String,
  RAISON_SOC: String,
  NOM: String,
  DATE_CREA: String,
  ENSEIGNE: String,
  ADRESSE: String,
  CP: Number,
  VILLE: String,
  APE: String,
  NAF: String,
  COOR: [{
    LAT: Number,
    LNG: Number
  }],
  LOC: {
  	type: [Number],
  	index: '2d'
  },
  DATE_UPLOAD: Date,
  RECLAIMED: String,
  TAGS: [String],
});
var Companies = mongoose.model('Company', CompanySchema);

console.log('Connection to DB...');
mongoose.connect("mongodb://localhost/latoo-dev", {db: {safe: true}});
mongoose.connection.on('error', function(err) {
	console.error('MongoDB connection error: ' + err);
	process.exit(-1);
	}
);
console.log('Done.');
var refactor = function(offset, limit, total) {
	if (offset > total) {
		console.log('Companies done : ' + total + '/' + total);
		console.log('Done');
		process.exit();
	}
	let newCompanies = [];
	Companies.find({}, {'COOR': true}, {skip: offset, limit: limit}).then(res => {
		res.forEach((elem, index) => {
			if (elem.LOC === undefined && elem.COOR.length > 0 && elem.COOR[0].LAT && elem.COOR[1].LNG) {
				newCompanies.push({
					_id: elem._id,
					LOC: [elem.COOR[1].LNG, elem.COOR[0].LAT],
				});
			}
		});
		let promises = [];
		newCompanies.forEach(v => {
			promises.push(Companies.update({_id: v._id}, {$set: v}));
		});
		return Promise.all(promises);
		process.exit();
	})
	.then(done => {
		console.log('Companies done : ' + (offset + limit) + '/' + total);
		refactor(offset + limit, limit, total)
	})
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
};

Companies.count().then(count => {
	refactor(0, 1000, count);
});