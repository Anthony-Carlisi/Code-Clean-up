//This is a function to pull from iMerchant database using any query
const mssql = require('../JS_Helper/MSSQL_SEARCH'),
//This pulls functions that help ricochet such as, Ricochet Tag Update & Ricochet Search, and Ricochet Create
    ricochetHelper = require('../JS_Helper/RICOCHET_HELPER'),
//Moment date formatter module 
    moment = require('moment')

var from = moment(Date.now())
    .subtract(31, 'days')
    .format('YYYY-MM-DD'),

    to = moment(Date.now())
    .subtract(30, 'days')
    .format('YYYY-MM-DD'),

//console.log(from + ' ' + to )

/*
What this query does is it looks at the vwAssignmentAndUpdates tables and inner joins them with Businesses and Quicks
to join in the respective merchants information into the same table / query
The fields I am pulling is as follows

Full Name from Businesses
Business Phone From Businesses
MID from vwAssignmentAndUpdates
Company name from vwAssignmentAndUpdates
Mobile phone from QuickApps
Email from QuickApps

The innerjoin is joint to both Businesses and QuickApps by the MID

The parameters for this query is if the status is app out and the update DateTime is between -2 day to -1 day

*/
    query = 
    `SELECT 
        vwAssignmentsAndUpdates.MID,
        vwAssignmentsAndUpdates.[Business Name] AS companyName,
        Businesses.contactname AS fullName,
        QuickApps.homeemail as Email,
		Phone = CASE WHEN QuickApps.mobile IN ('', NULL) OR LEN(QuickApps.mobile) < 10 THEN vwAssignmentsAndUpdates.[Business Phone] ELSE QuickApps.mobile END
    FROM vwAssignmentsAndUpdates
        INNER JOIN Businesses ON vwAssignmentsAndUpdates.MID = Businesses.id
        INNER JOIN QuickApps ON vwAssignmentsAndUpdates.MID = QuickApps.businessid
        WHERE [New Status] = 'app out' AND [Update DateTime] BETWEEN '${from}' AND '${to}'
        ORDER BY [Update DateTime] DESC`

function thirtyDayAppOutRecycle() {
    //What this function does is it pulls an mssqlSearch using the query displayed above and returns the data obtained (var is called response in this instance)
    mssql.mssqlSearch(query).then((response) => {
        if (response != undefined) {
            //For each statement to check if the response matches the following categories below
            response.forEach(jsdata  => {

                var data = {
                    "MID": jsdata.MID,
                    "Company Name": jsdata.companyName,
                    "First Name": jsdata.fullName,
                    "Phone": jsdata.Phone,
                    "Email": jsdata.Email
                }
                //the Posting URL in which I want to create a lead for this is the posting URL for Power hour in this example
                const postingto = 'https://leads.ricochet.me/api/v1/lead/create/Power-Hour?token=1ef9c4efa09e3cb6d9a31a435f711997'
                //This function helps to create a new lead in ricochet the parameters it needs to pass is the posting URL(this is the lead source you want to post to)
                //And also the data which is the information you want to create a lead for, also it will return the Ricochet ID
                ricochetHelper.RicoPostNewLead(postingto, data).then((response) =>{
                    //The parameters is to see if the posted new lead is a duplicate or not if not then it will add the power hour api tag to the respective leads tags
                    if (response.message != 'Duplicate') {
                        //This function adds a tag to whatever lead is passed in the parameters
                       ricochetHelper.RicoUpdateTag(response.lead_id, 'Power Hour API')
                    }
                })
            })    
        }
    })
}
//thirtyDayAppOutRecycle()
module.exports = thirtyDayAppOutRecycle