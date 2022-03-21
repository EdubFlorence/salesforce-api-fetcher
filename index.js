var axios = require('axios');
var jsforce = require('jsforce');
var fs = require('fs');
const { stringify: CsvStringify } = require('csv-stringify/sync');

const token = require('./token.js');

const OUTPUT_DIR = "output/";
if (!fs.existsSync(OUTPUT_DIR)){
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function queryStudyList(conn) {
    return new Promise((resolve, reject) => {
        // Study__c   | Site_Study__c
        // --------------------------
        // Name       | Protocol__c
        // Stage__c   | --            // Needs to added to Site_Study__c and called "Master Study: Status"
        // Account    | ID18__c
        
        const query = `select
            Name,
            Stage__c,
            Account__c
            from Study__c
        `;

        conn.queryAll(query, (err, results) => {
            if (err) reject(err);

            const allRecords = [...results.records];

            if (results.nextRecordsUrl) {
                queryMore(conn, results.nextRecordsUrl, allRecords, resolve, reject);
            } else {
                resolve(allRecords);
            }
        });
    });
}

 function queryStudySiteList(conn) {
    return new Promise((resolve, reject) => {
        const query = `select
            Protocol__c,
            Postman_DE_or_PROD__c,
            Team_Name__c,
            Site_Admin_Email_Domain__c,
            Site_Number__c,
            Site_Account_Billing_Country__c,
            Name,
            Site_Account_Record_ID__c,
            Country__c,
            Site_Study_Parent_Account_ID__c,
            Site_Name__c,
            Site_Admin_First__c,
            Site_Admin_Last__c,
            Site_Admin_Email__c,
            Planned_SIV_Date__c,
            CreatedDate,
            ID18__c,
            Stage__c,
            Site_Account_Status__c,
            Standard_Checklist_Progress__c,
            SiteStudy_Parent_Account__c
            from Site_Study__c
        `;

        conn.queryAll(query, (err, results) => {
            if (err) reject(err);

            const allRecords = [...results.records];

            if (results.nextRecordsUrl) {
                queryMore(conn, results.nextRecordsUrl, allRecords, resolve, reject);
            } else {
                resolve(allRecords);
            }
        });
    });
}

function queryMore(conn, locator, allRecords, resolve, reject) {
    conn.queryMore(locator, (err, results) => {
        if (err) reject(err);

        allRecords.push(...results.records);

        if (results.nextRecordsUrl) {
            queryMore(conn, results.nextRecordsUrl, allRecords, resolve, reject);
        } else {
            resolve(allRecords);
        }
    });
}

function joinTables(studyList, studySiteList) {
    const joinedStudySites = studySiteList.map((studySite) => {
        const studyData = studyList.find((study) => {
            return study['Name'] === studySite['Protocol__c'] 
                   && study['Account__c'] === studySite['Site_Study_Parent_Account_ID__c'];
        });

        if (!studyData) {
            debugger;
        }

        return {
            ...studySite,
            'Master Study: Status':  studyData['Stage__c']
        }
    });

    return joinedStudySites;
}

function remapColumnNames(records) {
    return records.map((record) => {
        return {
            'Master Study: Protocol #': record['Protocol__c'],
            'Postman DE or PROD': record['Postman_DE_or_PROD__c'],
            'Team Name': record['Team_Name__c'],
            'Site Admin Email Domain': record['Site_Admin_Email_Domain__c'],
            'Site Number': record['Site_Number__c'],
            'Site Account Billing Country': record['Site_Account_Billing_Country__c'],
            'Site Study Name': record['Name'],
            'Site Account Record ID': record['Site_Account_Record_ID__c'],
            'Country': record['Country__c'],
            'Site Study Parent Account ID': record['Site_Study_Parent_Account_ID__c'],
            'Site Account: Account Name': record['Site_Name__c'],
            'Site Admin: Full Name': `${record['Site_Admin_First__c'] || ''} ${record['Site_Admin_Last__c'] || ''}`.trim(),
            'Site Admin Email': record['Site_Admin_Email__c'],
            'Planned SIV Date': record['Planned_SIV_Date__c'],
            'Created Date': record['CreatedDate'],
            'Study Site ID': record['ID18__c'],
            'Stage': record['Stage__c'],
            'Master Study: Status': record['Master Study: Status'], // joined
            'Site Study Parent Account': record['SiteStudy_Parent_Account__c']
        }
    });
}

function saveCsv(records, organization) {
    const csv = CsvStringify(records, { header: true });
    fs.writeFileSync(`${OUTPUT_DIR}sfdc-extract-PROD-${organization}.csv`, csv);
}

(async () => {
    const res = await axios.post(token.token_url, token.queryString);

    const conn = new jsforce.Connection({
        instanceUrl: res.data.instance_url,
        accessToken: res.data.access_token
    });

    const studyList = await queryStudyList(conn);
    const studySiteList = await queryStudySiteList(conn);

    const joinedStudySites = joinTables(studyList, studySiteList);

    const remappedRecords = remapColumnNames(joinedStudySites);

    saveCsv(remappedRecords, 'allOrganizations');

    const pfizer = remappedRecords.filter((record) => record['Site Study Parent Account'] === 'Pfizer');
    saveCsv(pfizer, 'Pfizer');

    const iqvia = remappedRecords.filter((record) => record['Site Study Parent Account'] === 'IQVIA');
    saveCsv(iqvia, 'IQVIA');

    const merck = remappedRecords.filter((record) => record['Site Study Parent Account'] === 'Merck/MSD');
    saveCsv(merck, 'Merck');
})();
