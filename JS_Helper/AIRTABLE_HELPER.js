var Airtable = require('airtable'),
  base = new Airtable({ apiKey: 'keyZ0WMDk0n8pJ7yl' }).base(
    'appumwVbyIXggVLmr'
  );

const airtableSearch = async (searchField, fieldToSearch, tableToSearch) => {
  const records = await base(tableToSearch)
    .select({
      filterByFormula: `${fieldToSearch} = "${searchField}"`,
    })
    .all();
  if (typeof records[0] !== 'undefined') {
    return records[0];
  } else {
    return undefined;
  }
};

const airtableSearch2 = async (searchField, fieldToSearch, tableToSearch) => {
  const records = await base(tableToSearch)
    .select({
      filterByFormula: `${fieldToSearch} = "${searchField}"`,
    })
    .all();
  if (typeof records[0] !== 'undefined') {
    return records;
  } else {
    return undefined;
  }
};

function airtableCreate(data, tableToCreate) {
  base(tableToCreate).create([data], { typecast: true }, (err, record) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(record[0].id);
  });
}

function airtableUpdate(data, record_id, tableToUpdate) {
  base(tableToUpdate).update(record_id, data, (err, record) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(record.getId());
  });
}

const airtableDupBlockSearch = async (phoneSearch) => {
  const records = await base('Merchant Records')
    .select({
      filterByFormula: `AND(SEARCH({Business Phone Text}, '${phoneSearch}' & ""), OR(Status = "Funded", {Status Change Date} >= DATEADD(TODAY(),-90,'days')), NOT({Business Phone} = ""))`,
    })
    .all();
  if (typeof records[0] !== 'undefined') {
    return records[0];
  } else {
    const records = await base('Inbound Leads')
      .select({
        filterByFormula: `AND(SEARCH({Mobile Phone Formatted}, '${phoneSearch}' & ""), OR({Agent Status}= "App Out - Interested", {Created Date} >= DATEADD(TODAY(),-30,'days')), NOT({Mobile Phone Formatted} = ""), {Lead Type (Vehicle)} = "SEO Lead")`,
      })
      .all();
    if (typeof records[0] !== 'undefined') {
      return 'Dup Block';
    } else {
      return undefined;
    }
  }
};

module.exports = {
  airtableSearch,
  airtableSearch2,
  airtableCreate,
  airtableUpdate,
  airtableDupBlockSearch,
};
