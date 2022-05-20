const jsforce = require('jsforce')
const config = require('config')

//connect to Salesforce
const conn = new jsforce.Connection({
  loginUrl: 'https://login.salesforce.com',
})

//login to Salesforce
conn.login(
  config.get('salesforceEmail'),
  config.get('salesforcePassword') + config.get('salesforceToken'),
  (err, userInfo) => {
    if (err) {
      console.log(err)
    } else {
    }
  }
)

const salesforceInsert = async (objectName, body) => {
  try {
    let result = await conn.sobject(objectName).create(body, function (err, ret) {
      if (err || !ret.success) return
      console.log('Created record id : ' + ret.id)
    })
    return result
  } catch (error) {
    return error
  }
}

const salesforceQuery = async (query) => {
  try{
    let result = await conn.query(query)
    return result
  } catch (error){
    console.error("sfHandler.js: " + error)
    return error
  }
}

module.exports = {
    salesforceInsert,
    salesforceQuery
}