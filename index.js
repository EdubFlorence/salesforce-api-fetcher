var axios = require('axios');
var jsforce = require('jsforce');

const token = require('./token.js');

axios.post(token.token_url, token.queryString)
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