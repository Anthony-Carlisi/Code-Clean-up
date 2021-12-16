const airtableHelper = require('../JS_Helper/AIRTABLE_HELPER'),
  moment = require('moment');

var Airtable = require('airtable'),
  base = new Airtable({ apiKey: 'keyZ0WMDk0n8pJ7yl' }).base(
    'appumwVbyIXggVLmr'
  );

const airtableSearch3 = async (searchField, fieldToSearch, tableToSearch) => {
  const records = await base(tableToSearch)
    .select({
      filterByFormula: `AND(SEARCH(${fieldToSearch}, '${searchField}' & ""), {Lead Type (Vehicle)} = "SMS We Process")`,
    })
    .all();
  if (typeof records[0] !== 'undefined') {
    return records[0];
  } else {
    return undefined;
  }
};
var phoneNumberFormatted = 3802224397;
airtableSearch3(
  phoneNumberFormatted,
  '{Mobile Phone Formatted}',
  'Inbound Leads'
).then((response) => {
  console.log(response);
});
