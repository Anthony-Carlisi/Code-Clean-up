// add route to from rico to SF
const jsforce = require('jsforce')
const express = require('express')
const config = require('config')

const conn = new jsforce.Connection({
  loginUrl: 'https://login.salesforce.com',
})

const salesforceTest = async () => {
  try {
    // Salesforce Login
    await conn.login(
      config.get('salesforceEmail'),
      config.get('salesforcePassword') + config.get('salesforceToken'),
      (err) => {
        if (err) return err
      }
    )

    const leadId = '00Q8c00000znydX'
    //search for agents userID
    const lead = async (leadId) =>
      await conn.query(
        `SELECT id FROM Lead WHERE id = ${leadId}`,
        (err, data) => {
          if (err) return 'err'
          if (data.totalSize !== 0) return data.records[0].Id
        }
      )

    if (await lead()) {
      console.log('test')

      await conn.logout(function (err) {
        if (err) {
          return console.error(err)
        }
        // now the session has been expired.
      })
    }
  } catch (err) {
    console.error(err.message)
  }
}

salesforceTest()
