var axios = require('axios');
var jsforce = require('jsforce');
var fs = require('fs');

const token = require('./token.js');

const OUTPUT_DIR = "output/";
if (!fs.existsSync(OUTPUT_DIR)){
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

axios.post(token.token_url, token.queryString)
    .then(function (res) {

        var conn = new jsforce.Connection({
            instanceUrl: res.data.instance_url,
            accessToken: res.data.access_token
        });

        // just the values of our enum:
        // Object.values(enums).join(",")

        // Study (ID), and Site (ID)
        // sponsor id
        var type = "Site_Study__c";
        var limit = 15;
        var query = `select ${enums.SITE_STUDY_ID}, Name, Site_Name_from_ID__c, ${enums.PROGRESS}, 
            Site_Number__c, Site_Account_Record_ID__c, 
            Country__c,
            Site_Study_Parent_Account_ID__c,
            Master_study__c
            from ${type} limit ${limit}`;

        conn.query(query, function (err, results) {
            if(err) console.error(err);
            // console.log(JSON.stringify(results.records[0])); // eslint-disable-line no-console
            // We may want to "reverse lookup" our enums to put the salesforce _label_ on the result, instead of the sf field _name_
            console.log(`Writing to ${OUTPUT_DIR}results.json`);
            fs.writeFileSync(`${OUTPUT_DIR}results.json`, JSON.stringify(results.records));
        });
    });

const enums = {
    SITE_STUDY_ID: "ID",
    TEAM_NAME: "Team_Name__c",
    PROGRESS: "Standard_Checklist_Progress__c"
}