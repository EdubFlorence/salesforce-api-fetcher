var axios = require('axios');
var jsforce = require('jsforce');
var fs = require('fs');

const token = require('./token.js');

axios.post(token.token_url, token.queryString)
    .then(function (res) {

        var conn = new jsforce.Connection({
            instanceUrl: res.data.instance_url,
            accessToken: res.data.access_token
        });

    // "describe": "/services/data/v42.0/sobjects/Site/describe",
    // Site_Study__c
    // Florence_eHub_Site__c
    // "describe": "/services/data/v42.0/sobjects/SiteDetail/describe",

    var type = "Site_Study__c";
    conn.describe(type, function(err, result) {
        if(err) console.error(err);
        fs.writeFileSync(`${type}.json`, JSON.stringify(result));
    });

    /*
    conn.describeGlobal(function (err, result) {
        if(err) console.error(err);
        // console.log(JSON.stringify(results.records[0])); // eslint-disable-line no-console
        fs.writeFileSync("output.json", JSON.stringify(result.sobjects));
        // console.log(result);
    });
    */
});

function writeArrayToFile(fileName, array) {

    var file = fs.createWriteStream(fileName);
    file.on('error', function(err) { console.error(err) });
    array.forEach(function(v) { file.write(v.join(', ') + '\n'); });
    file.end();
}