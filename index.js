var axios = require('axios');
var jsforce = require('jsforce');
var querystring = require('querystring');

const token = require('./token.js');

var params = {
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: token.token
};

axios.post(token.token_url, querystring.stringify(params))
    .then(function (res) {

        var conn = new jsforce.Connection({
            instanceUrl: res.data.instance_url,
            accessToken: res.data.access_token
        });

        var query = 'select Name from Site_Study__c limit 15';

        conn.query(query, function (err, results) {
            if(err) console.error(err);
            console.log(JSON.stringify(results.records[0])); // eslint-disable-line no-console
        });
    });