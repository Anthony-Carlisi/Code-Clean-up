const Airtable = require('airtable')
const config = require('config')

const base = new Airtable({ apiKey: config.get('airtableApiKey') }).base(
  config.get('airtableBase')
)

const airtableSearch = async (table, filterFormula, scrubbingView) => {
  try {
    const records = await base(table)
      .select({
        //Change filter params
        filterByFormula: filterFormula,
        view: scrubbingView,
      })
      .all()
    return records
  } catch (error) {
    console.log(error)
  }
}

const airtableUpdate = async (table, recordId, data) => {
  try {
    const recordUpdate = await base(table).update([
      {
        id: recordId,
        fields: data,
      },
    ])
    return recordUpdate
  } catch (error) {
    console.log(error)
  }
}

const airtableCreate = async (table, data) => {
  try {
    const newRecord = await base(table).create([
      {
        fields: data,
      },
    ])
    return newRecord
  } catch (error) {
    console.log(error)
  }
}

module.exports = {
  airtableSearch,
  airtableUpdate,
  airtableCreate,
}
