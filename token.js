
var fs = require('fs');
var jwt = require('jsonwebtoken');
var moment = require('moment');
var url = require('url');
var querystring = require('querystring');

var privatekey = fs.readFileSync('certs/key.pem');
var credentials = require('./credentials.js');

var jwtparams = {
    iss: credentials.salesforce.consumer_key,
    prn: credentials.salesforce.username,
    aud: credentials.salesforce.url,
    exp: parseInt(moment().add(2, 'minutes').format('X'))
};

var token = jwt.sign(jwtparams, privatekey, { algorithm: 'RS256' });

var token_url = new url.URL('/services/oauth2/token', credentials.salesforce.url).toString();

var params = {
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: token
};

var queryString = querystring.stringify(params);

module.exports = {
    "token": token,
    "token_url": token_url,
    "params": params,
    "queryString": queryString
}