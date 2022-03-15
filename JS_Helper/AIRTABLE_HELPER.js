const moment = require('moment')
const rico = require('./RICOCHET_HELPER')
var Airtable = require('airtable'),
  base = new Airtable({ apiKey: 'keyZ0WMDk0n8pJ7yl' }).base('appumwVbyIXggVLmr')

const airtableSearch = async (searchField, fieldToSearch, tableToSearch) => {
  const records = await base(tableToSearch)
    .select({
      filterByFormula: `${fieldToSearch} = "${searchField}"`,
    })
    .all()
  if (typeof records[0] !== 'undefined') {
    return records[0]
  } else {
    return undefined
  }
}

const airtableSearch2 = async (searchField, fieldToSearch, tableToSearch) => {
  const records = await base(tableToSearch)
    .select({
      filterByFormula: `${fieldToSearch} = "${searchField}"`,
    })
    .all()
  return records
}

const airtableSearch3 = async (searchField, fieldToSearch, tableToSearch) => {
  const records = await base(tableToSearch)
    .select({
      filterByFormula: `AND(SEARCH(${fieldToSearch}, '${searchField}' & ""), {Lead Type (Vehicle)} = "SMS We Process")`,
    })
    .all()
  if (typeof records[0] !== 'undefined') {
    return records[0]
  } else {
    return undefined
  }
}

const airtableSearch4 = async () => {
  const records = await base('Merchant Records')
    .select({
      filterByFormula: `IF({Sub Status},'true')`,
    })
    .all()
  return records
}

async function airtableSubstatus() {
  try {
    let results = await airtableSearch4()
    results.forEach((jsdata) => {
      if (jsdata.fields['Sub Status'] !== 'Call Back') {
        var updateRecord = {
          fields: { Status: jsdata.fields['Sub Status'], 'Sub Status': null },
        }
        airtableUpdate(updateRecord.fields, jsdata.id, 'Merchant Records')
      } else if (
        jsdata.fields['Sub Status Change Date'] <
        jsdata.fields['Status Change Date']
      ) {
        var updateRecord = {
          fields: { 'Sub Status': null },
        }
        airtableUpdate(updateRecord.fields, jsdata.id, 'Merchant Records')
      }
    })
    //return results;
  } catch (error) {
    console.log(error)
  }
}

function airtableCreate(data, tableToCreate) {
  base(tableToCreate).create([data], { typecast: true }, (err, record) => {
    if (err) {
      console.error(err)
      return
    }
    return record[0]
  })
}

function airtableUpdate(data, record_id, tableToUpdate) {
  base(tableToUpdate).update(record_id, data, (err, record) => {
    if (err) {
      console.error(err)
      return
    }
    console.log(record.getId())
    return record
  })
}

const airtableSearch5 = async () => {
  try {
    const records = await base('Merchant Records')
      .select({
        filterByFormula: `DATETIME_DIFF({Status Change Date (DUPS)}, DATEADD(TODAY(),-90,'days'), 'days') = 0`,
      })
      .all()
    return records
  } catch (error) {
    console.log(error)
  }
}

// var test = moment(Date.now()).format('YYYY-MM-DD');
// console.log(test);
// airtableSearch5('{Status Change Date (DUPS)}', test, 'Merchant Records').then(
//   (response) => console.log(response)
// );

module.exports = {
  airtableSearch,
  airtableSearch2,
  airtableSearch3,
  airtableSearch4,
  airtableSearch5,
  airtableSubstatus,
  airtableCreate,
  airtableUpdate,
}
