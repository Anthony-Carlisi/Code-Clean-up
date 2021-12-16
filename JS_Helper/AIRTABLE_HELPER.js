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
  return records;
};

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

function airtableCreate(data, tableToCreate) {
  base(tableToCreate).create([data], { typecast: true }, (err, record) => {
    if (err) {
      console.error(err);
      return;
    }
    return record[0];
  });
}

function airtableUpdate(data, record_id, tableToUpdate) {
  base(tableToUpdate).update(record_id, data, (err, record) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(record.getId());
    return record;
  });
}

module.exports = {
  airtableSearch,
  airtableSearch2,
  airtableCreate,
  airtableUpdate,
};
