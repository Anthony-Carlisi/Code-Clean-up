const mssql = require('../JS_Helper/MSSQL_SEARCH'),
    ricochetHelper = require('../JS_Helper/RICOCHET_HELPER'),
    moment = require('moment')

var from = moment(Date.now())
    .subtract(46, 'days')
    .format('YYYY-MM-DD'),

    to = moment(Date.now())
    .subtract(45, 'days')
    .format('YYYY-MM-DD'),

    query = 
    `SELECT 
        vwAssignmentsAndUpdates.MID,
        vwAssignmentsAndUpdates.[Business Name] AS companyName,
        Businesses.contactname AS fullName,
        QuickApps.homeemail as Email,
        vwAssignmentsAndUpdates.[Team Name] as teamName,
        Phone = CASE WHEN QuickApps.mobile IN ('', NULL) OR LEN(QuickApps.mobile) < 10 THEN vwAssignmentsAndUpdates.[Business Phone] ELSE QuickApps.mobile END
    FROM vwAssignmentsAndUpdates
        INNER JOIN Businesses ON vwAssignmentsAndUpdates.MID = Businesses.id
        INNER JOIN QuickApps ON vwAssignmentsAndUpdates.MID = QuickApps.businessid
    WHERE ([New Status] = 'submitted' OR [New Status] = 'approval' OR [New Status] = 'contract in' OR [New Status] = 'contract out') AND [Update DateTime] BETWEEN '${from}' AND '${to}'
    ORDER BY [Update DateTime] DESC`

function fourtyFiveDayAppOutRecycle() {
    mssql.mssqlSearch(query).then((response) => {
        response.forEach(jsdata  => {
            var data = {
                "MID": jsdata.MID,
                "Company Name": jsdata.companyName,
                "First Name": jsdata.fullName,
                "Phone": jsdata.Phone,
                "Email": jsdata.Email
            }
            var team = jsdata.teamName
            team = team.substring(0, team.indexOf('/'));
            if (team === 'Joe Davino') {
                const postingto = 'https://leads.ricochet.me/api/v1/lead/create/Recycle-Senior?token=1ef9c4efa09e3cb6d9a31a435f711997'
                ricochetHelper.RicoPostNewLead(postingto, data).then((response) =>{
                    if (response.message != 'Duplicate') {
                        ricochetHelper.RicoUpdateTag(response.lead_id, 'Recycle Senior API')
                    }
                })
            } else {
                const postingto = 'https://leads.ricochet.me/api/v1/lead/create/Recycle-Seniors?token=1ef9c4efa09e3cb6d9a31a435f711997'
                ricochetHelper.RicoPostNewLead(postingto, data).then((response) =>{
                    if (response.message != 'Duplicate') {
                        ricochetHelper.RicoUpdateTag(response.lead_id, 'Recycle Seniors API')
                    }
                })
            }
        })
    })
}
fourtyFiveDayAppOutRecycle()
module.exports = fourtyFiveDayAppOutRecycle