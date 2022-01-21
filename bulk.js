var axios = require('axios');
var jsforce = require('jsforce');
var fs = require('fs');

const token = require('./token.js');

const OUTPUT_DIR = "output/";
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

axios.post(token.token_url, token.queryString)
    .then(function (res) {

        var conn = new jsforce.Connection({
            instanceUrl: res.data.instance_url,
            accessToken: res.data.access_token
        });

        console.log("SF API Limit: " + conn.limitInfo.apiUsage.limit);
        console.log("SF API Used: " + conn.limitInfo.apiUsage.used);

        var type = "Site_Study__c";
        var query = `select ${enums.SITE_STUDY_ID}, Name, Site_Name_from_ID__c, ${enums.PROGRESS}, 
            Site_Number__c, Site_Account_Record_ID__c, 
            Country__c,
            Site_Study_Parent_Account_ID__c,
            Master_study__c
            from ${type}`;
        var fileName = `${OUTPUT_DIR}${type}-results.json`;

        conn.bulk.query(query)
            .stream().pipe(fs.createWriteStream(fileName));
    });

const enums = {
    SITE_STUDY_ID: "ID",
    TEAM_NAME: "Team_Name__c",
    PROGRESS: "Standard_Checklist_Progress__c"
}