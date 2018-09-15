'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PostSchema = new Schema({
    TITLE: String,
    CONTENT: String
});

var ReducSchema = new Schema({
    TYPE: String,
    PRODUCT: String,
    VALUE: String,
    START_DATE: String,
    END_DATE: String
});

var CompanyInfosSchema = new Schema({
    ID: String,
    DESCRIPTION: String,
    PHONE: String,
    EMAIL: String,
    PROFIL_PICTURE: String,//{data: Buffer, contentType: String},
    COVER_PICTURE: String,//{data: Buffer, contentType: String},
    SUPP_PICTURE: [
        String,
        String,
        String
    ],
    WEBSITE: String,
    SOCIAL: {
        FACEBOOK: String,
        TWITTER: String,
        GPLUS: String,
        SNAPCHAT: String,
        INSTA: String,
    },
    HOUR: {
        mon: {am: Date, pm: Date, closed: Boolean},
        tue: {am: Date, pm: Date, closed: Boolean},
        wen: {am: Date, pm: Date, closed: Boolean},
        thu: {am: Date, pm: Date, closed: Boolean},
        fri: {am: Date, pm: Date, closed: Boolean},
        sat: {am: Date, pm: Date, closed: Boolean},
        sun: {am: Date, pm: Date, closed: Boolean},
    },
    POSTS: [
        {
            type: Schema.Types.ObjectId,
            ref: 'PostSchema',
            limit: 25
        }
    ],
    REDUCTIONS: [
        {
            type: Schema.Types.ObjectId,
            ref: 'ReducShema',
            limit: 50
        }
    ]
});

module.exports = mongoose.model('CompanyInfos', CompanyInfosSchema);