var moment = require('moment');

var Airtable = require('airtable'),
  base = new Airtable({ apiKey: 'keyZ0WMDk0n8pJ7yl' }).base(
    'appumwVbyIXggVLmr'
  );

async function airtableSearch2(searchField, fieldToSearch, tableToSearch) {
  const records = await base(tableToSearch)
    .select({
      filterByFormula: `${fieldToSearch} = "${searchField}"`,
    })
    .all();
  return records;
}
var user = 'anapolitano@straightlinesource.com';
airtableSearch2(7732093562, '{Business Phone Text}', 'Merchant Records').then(
  (req) => {
    if (!req.length) {
      console.log('Create New Lead');
    } else {
      let users = airtableSearch2(user, '{Email}', 'Agent Table');
      console.log(await users);
      req.forEach((jsdata) => {});
    }

    // console.log(req.length);
    // console.log(req[0].fields.Status);
    // console.log(req[0].fields['Status Change Date']);
    // console.log(
    //   req[0].fields['Status Change Date'] <
    //     moment(Date.now()).subtract(45, 'days').format('YYYY-MM-DD')
    // );
    // if (
    //   req[0].fields['Status Change Date'] <
    //   moment(Date.now()).subtract(45, 'days').format('YYYY-MM-DD')
    // ) {
    //   console.log('Test');
    // }
  }
);
