var axios = require('axios');
var jsforce = require('jsforce');
var fs = require('fs');
const { stringify: CsvStringify } = require('csv-stringify/sync');

const token = require('./token.js');

// Run `node describe.js` first
const columnNameMap = require('./output/Site_Study__c.json');

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

        var derp = conn.limitInfo?.apiUsage?.limit;
        
        if(conn.limitInfo?.apiUsage?.limit !== undefined) console.log("API Limit: " + conn.limitInfo.apiUsage.limit);
        if(conn.limitInfo?.apiUsage?.used !== undefined) console.log("API Limit: " + conn.limitInfo.apiUsage.used);
        else console.log("API limit info empty.");

        var type = "Site_Study__c";
        var query = `select
            ID18__c,
            Protocol__c,
            ${enums.TEAM_NAME},
            Site_Number__c,
            Name,
            Site_Account_Record_ID__c,
            Country__c,
            Site_Study_Parent_Account_ID__c,
            Site_Account__c,
            Planned_SIV_Date__c,
            CreatedDate,
            Stage__c,
            Site_Account_Status__c,
            Standard_Checklist_Progress__c,
            SiteStudy_Parent_Account__c
            from ${type}
        `;

        conn.queryAll(query, function (err, results) {
            // "/services/data/v42.0/query/01g1K00006VJSo4QAH-2000"
            // results.nextRecordsUrl
            if(err) console.error(err);
            // console.log(JSON.stringify(results.records[0])); // eslint-disable-line no-console
            // We may want to "reverse lookup" our enums to put the salesforce _label_ on the result, instead of the sf field _name_

            const remappedRecords = remapColumnNames(results.records);
            const allRecords = [...remappedRecords];

            if (results.nextRecordsUrl) {
                queryMore(conn, results.nextRecordsUrl, allRecords);
            } else {
                saveCsv(allRecords);
            }
        });
    });

function remapColumnNames(records) {
    return records.map((record) => {
        return Object.keys(record).reduce((acc, key) => {
            if (key === 'attributes') return acc;

            if (key === 'Protocol__c') {
                acc['Master Study Protocol Number'] = record[key];
                return acc;
            }

            const friendlyKey = columnNameMap[key];
            acc[friendlyKey] = record[key];
            return acc;
        }, {});
    });
}

function saveCsv(records) {
    const csv = CsvStringify(records, { header: true });
    fs.writeFileSync(`${OUTPUT_DIR}results.csv`, csv);
}

function queryMore(conn, locator, allRecords) {
    conn.queryMore(locator, function (err, results) {
        if (err) console.error(err);

        const remappedRecords = remapColumnNames(results.records);
        allRecords.push(...remappedRecords);

        if (results.nextRecordsUrl) {
            queryMore(conn, results.nextRecordsUrl, allRecords);
        } else {
            saveCsv(allRecords);
        }
    });
}

const enums = {
    SITE_STUDY_ID: "ID",
    TEAM_NAME: "Team_Name__c",
    PROGRESS: "Standard_Checklist_Progress__c"
}