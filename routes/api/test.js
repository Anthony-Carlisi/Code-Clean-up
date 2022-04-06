const express = require('express')
const router = express.Router()
const jsforce = require('jsforce')
const config = require('config')
const multer = require('multer')

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'temp/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  },
})
const uploadFile = multer({ storage: storage })

// initial Salesfoce Connection
const conn = new jsforce.Connection({
  loginUrl: 'https://login.salesforce.com',
})

// @route   Post api/test
// @desc    test
// @access  Public
router.post('/', uploadFile.single('file'), async (req, res) => {
  try {
    //Deconstruct Object
    const {
      q63_fundingspecialist: agentFullName,
      q138_Amount_Requested: amountRequest,
      q174_use_of_funds: useOfFunds,
      q12_federal_tax_id: federalTaxId,
      q7_legalbusinessname: legalBusinessName,
      q8_business_dba: businessDba,
      q161_Industry_Type: industryType,
      q24_entity_type: entityType,
      q27_state_incorporated: stateIncorp,
      q175_annual_revenue: annRevenue,
      q14_business_address: businessAddress,
      q186_business_phone: { full: businessPhone },
      q16_business_city: businessCity,
      q28_business_state: businessState,
      q25_business_zip: businessZip,
      q121_f_first_name: fFirstName,
      q122_f_last_name: fLastName,
      q187_f_cell_phone: { full: fCellPhone },
      q36_f_ssn: fSsn,
      q38_businessOwnership: fBusinessOwnership,
      q40_f_home_address: fHomeAddress,
      q45_email: fEmail,
      q43_f_city: fCity,
      q156_f_state: fState,
      q42_f_zip_code: fZipCode,
      q185_leadId: leadId,
    } = JSON.parse(req.body.rawRequest)

    // Salesforce Login
    await conn.login(
      config.get('salesforceEmail'),
      config.get('salesforcePassword') + config.get('salesforceToken'),
      (err) => {
        if (err) return err
      }
    )

    // Searchs leads based off lead id will return either an id or undefined
    const lead = async (leadId) =>
      await conn.query(
        `SELECT id FROM Lead WHERE id = ${leadId}`,
        (err, data) => {
          if (err) return 'err'
          if (data.totalSize !== 0) return data.records[0].Id
        }
      )

    // if lead query returns an object if will continue
    if (await lead(leadId)) {
      //updating the lead based off id
      await conn.sobject('Lead').update(
        {
          id: leadId,
          Phone: businessPhone,
          name: fFirstName + ' ' + fLastName,
          Company: legalBusinessName,
          Email: fEmail,
          McaApp__Federal_Tax_ID_No__c: federalTaxId,
          McaApp__Amount_Requested__c: amountRequest,
          McaApp__Use_of_Proceeds__c: useOfFunds,
          McaApp__DBA_Name__c: businessDba,
          McaApp__Social_Security_Number__c: fSsn,
        },
        function (err, res) {
          if (err || !req.success) return console.error(err)
        }
      )

      await conn.logout(function (err) {
        if (err) return console.error(err)
      })
    }

    res.status(200).send(`Lead Updated ${leadId}`)
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
})

module.exports = router
