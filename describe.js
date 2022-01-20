var axios = require('axios');
var jsforce = require('jsforce');
var fs = require('fs');

const token = require('./token.js');

const OUTPUT_DIR = "./output";
if (!fs.existsSync(OUTPUT_DIR)){
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/*
const describeSubject = process.argv[2];
if(describeSubject == null || describeSubject == undefined || describeSubject == "") {
    console.error("Specify an object to describe, or 'global' to describe all.");
    process.exit(1);
}
*/

axios.post(token.token_url, token.queryString)
    .then(function (res) {

    var conn = new jsforce.Connection({
        instanceUrl: res.data.instance_url,
        accessToken: res.data.access_token
    });

    // Objects to look into (from global): 
    // Site
    // SiteDetail
    // Site_Study__c
    // Florence_eHub_Site__c

    var type = "Site_Study__c";
    conn.describe(type, function(err, result) {
        if(err) console.error(err);
        // fs.writeFileSync(`${type}.json`, JSON.stringify(result));

        var fields = {};

        for(var field of result.fields) {
            fields[field.name] = field.label;
        }

        var fileName = `${OUTPUT_DIR}/${type}.json`;
        fs.writeFileSync(fileName, JSON.stringify(fields));
    });
});

function describeGlobal(conn) {

    conn.describeGlobal(function (err, result) {
        if(err) console.error(err);
        // console.log(JSON.stringify(results.records[0])); // eslint-disable-line no-console
        fs.writeFileSync(`salesforce-global.json`, JSON.stringify(result.sobjects));
        // console.log(result);
    });
}

function writeArrayToFile(fileName, array) {

    var file = fs.createWriteStream(fileName);
    file.on('error', function(err) { console.error(err) });
    array.forEach(function(v) { file.write(v.join(', ') + '\n'); });
    file.end();
}