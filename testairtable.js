var moment = require('moment');

var Airtable = require('airtable'),
  base = new Airtable({ apiKey: 'keyZ0WMDk0n8pJ7yl' }).base(
    'appumwVbyIXggVLmr'
  );

const airtableDupBlockSearch = async (phoneSearch) => {
  const records = await base('Merchant Records')
    .select({
      filterByFormula: `AND(SEARCH({Business Phone Text}, '${phoneSearch}' & ""), OR(Status = "Funded", {Status Change Date} >= DATEADD(TODAY(),-10,'days')), NOT({Business Phone} = ""))`,
    })
    .all();
  if (typeof records[0] !== 'undefined') {
    console.log('Dup Block');
    return 'Dup Block';
  } else {
    const records = await base('Merchant Records')
      .select({
        filterByFormula: `AND(SEARCH({Business Phone Text}, '${phoneSearch}' & ""), OR(Status = "Funded", {Status Change Date} <= DATEADD(TODAY(),-10,'days')), NOT({Business Phone} = ""))`,
      })
      .all();
    if (typeof records[0] !== 'undefined') {
      console.log('Lead to Reassign');
      console.log(records[0]);
      return records[0].id;
    } else {
      const records = await base('Inbound Leads')
        .select({
          filterByFormula: `AND(SEARCH({Mobile Phone Formatted}, '${phoneSearch}' & ""), {Created Date} >= DATEADD(TODAY(),-30,'days'), NOT({Mobile Phone Formatted} = ""), {Lead Type (Vehicle)} = "SEO Lead")`,
        })
        .all();
      if (typeof records[0] !== 'undefined') {
        console.log('Dup Block');
        return 'Dup Block';
      } else {
        console.log('Create New');
        return undefined;
      }
    }
  }
};

async function airtableSearch2(searchField, fieldToSearch, tableToSearch) {
  const records = await base(tableToSearch)
    .select({
      filterByFormula: `${fieldToSearch} = "${searchField}"`,
    })
    .all();
  return records;
}
var user = 'dmiller@straightlinesource.com';
airtableSearch2(7732093562, '{Business Phone Text}', 'Merchant Records').then(
  (req) => {
    airtableSearch2(user, '{Email}', 'Agent Table').then((userInfo) => {
      console.log(userInfo[0].id);
      if (!req.length) {
        console.log('Create New Lead');
      } else {
        loop1: for (jsdata of req) {
          for (assigneeToCheck of jsdata.fields.Assignees) {
            console.log(assigneeToCheck);
            if (userInfo[0].id === assigneeToCheck) {
              console.log('user found');
              break loop1;
            }
          }

          //   jsdata.fields.Assignees.forEach((assigneeToCheck) => {
          //     console.log(assigneeToCheck);
          //     if (userInfo[0].id === assigneeToCheck) {
          //       console.log('user found');
          //     }
          //   });
        }
      }
    });

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
