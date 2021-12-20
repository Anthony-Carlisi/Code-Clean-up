//Modules Needed
const airtableHelper = require('./JS_Helper/AIRTABLE_HELPER');

async function airtableSubstatus() {
  try {
    let results = await airtableHelper.airtableSearch4();
    results.forEach((jsdata) => {
      if (jsdata.fields['Sub Status'] !== 'Call Back') {
        console.log(jsdata.id);
        var updateRecord = {
          fields: { Status: jsdata.fields['Sub Status'], 'Sub Status': null },
        };
        airtableHelper.airtableUpdate(
          updateRecord.fields,
          jsdata.id,
          'Merchant Records'
        );
      } else if (
        jsdata.fields[
          'Sub Status Change Date' < jsdata.fields['Status Change Date']
        ]
      ) {
        var updateRecord = {
          fields: { 'Sub Status': null },
        };
        airtableHelper.airtableUpdate(
          updateRecord.fields,
          jsdata.id,
          'Merchant Records'
        );
      }
    });
    //return results;
  } catch (error) {
    console.log(error);
  }
}

airtableSubstatus();
