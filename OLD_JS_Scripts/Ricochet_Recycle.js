const mssql = require('../JS_Helper/MSSQL_SEARCH'),
  ricochetHelper = require('../JS_Helper/RICOCHET_HELPER'),
  moment = require('moment'),
  emailNotifications = require('../JS_Helper/EMAIL_NOTIFICATION'),
  { Parser } = require('json2csv');

var query = `select a.MID, a.[Business Name] AS [Company Name], Businesses.contactname AS [First Name], QuickApps.homeemail as Email, LEFT([Team Name], CHARINDEX('/', [Team Name]) - 1) AS Senior, a.Status AS statusAt, Phone = CASE WHEN QuickApps.mobile IN('', NULL) OR LEN(QuickApps.mobile) < 10 THEN a.[Business Phone] ELSE QuickApps.mobile END from (select ROW_NUMBER() OVER(PARTITION BY MID ORDER BY [Update DateTime] DESC) as tt,* from vwAssignmentsAndUpdates)a INNER JOIN Businesses ON MID = Businesses.id INNER JOIN QuickApps ON MID = QuickApps.businessid where a.tt=1 AND (((a.Status = 'app out' OR a.Status = 'call back') AND [Update DateTime] BETWEEN '${moment(
  Date.now()
)
  .subtract(31, 'days')
  .format('YYYY-MM-DD')}' AND '${moment(Date.now())
  .subtract(30, 'days')
  .format(
    'YYYY-MM-DD'
  )}') OR ((a.Status = 'contract out' OR a.Status = 'contract in' OR a.Status = 'submitted' OR a.Status = 'approval') AND [Update DateTime] BETWEEN '${moment(
  Date.now()
)
  .subtract(46, 'days')
  .format('YYYY-MM-DD')}' AND '${moment(Date.now())
  .subtract(45, 'days')
  .format(
    'YYYY-MM-DD'
  )}')) ORDER BY CASE a.Status WHEN 'contract out' THEN 1 WHEN 'contract in' THEN 2 WHEN 'approval' THEN 3 WHEN 'submitted' THEN 4 WHEN 'app out' THEN 5 WHEN 'call back' THEN 6 ELSE 7 END`;

function RecycleRicochet() {
  mssql.mssqlSearch(query).then((response) => {
    if (response != undefined) {
      //different arrays for each type of lead (pHData = PowerHour, sSingularData = Recycle Senior, sPluralData = Recycle Seniors)
      let pHData = [],
        sSingularData = [],
        sPluralData = [];

      response.forEach((jsdata) => {
        //PowerHour
        if (jsdata.statusAt === 'app out' || jsdata.statusAt === 'call back') {
          pHData = pHData.concat([jsdata].flat()); //add new data to pHData array
          ricochetHelper
            .RicoPostNewLead(
              'https://leads.ricochet.me/api/v1/lead/create/Power-Hour?token=1ef9c4efa09e3cb6d9a31a435f711997',
              jsdata
            )
            .then((response) => {
              ricochetHelper.RicoRecycleDupBlock(jsdata.Phone);
              if (response.message != 'Duplicate') {
                ricochetHelper.RicoUpdateTag(response.lead_id, 'Power Hour');
              }
            });
        } else if (jsdata.Senior === 'Joe Davino') {
          //Recycle Senior
          sSingularData = sSingularData.concat([jsdata].flat()); //add new data to sSingularData array
          ricochetHelper.RicoRecycleDupBlock(jsdata.Phone);
          ricochetHelper
            .RicoPostNewLead(
              'https://leads.ricochet.me/api/v1/lead/create/Recycle-Senior?token=1ef9c4efa09e3cb6d9a31a435f711997',
              jsdata
            )
            .then((response) => {
              if (response.message != 'Duplicate') {
                ricochetHelper.RicoUpdateTag(
                  response.lead_id,
                  'Recycle Senior'
                );
              }
            });
        } else {
          //Recycle Seniors
          sPluralData = sPluralData.concat([jsdata].flat()); //add new data to sPluralData array
          ricochetHelper.RicoRecycleDupBlock(jsdata.Phone);
          ricochetHelper
            .RicoPostNewLead(
              'https://leads.ricochet.me/api/v1/lead/create/Recycle-Seniors?token=1ef9c4efa09e3cb6d9a31a435f711997',
              jsdata
            )
            .then((response) => {
              if (response.message != 'Duplicate') {
                ricochetHelper.RicoUpdateTag(
                  response.lead_id,
                  'Recycle Seniors'
                );
              }
            });
        }
      });

      if (pHData.length > 0) {
        //PowerHour
        let csv1 = new Parser().parse(pHData); //json2csvParser
        emailNotifications.sendNotifications(
          'cgrippaldi@straightlinesource.com',
          'PowerHour',
          'PowerHour',
          'PowerHour',
          csv1
        );
        emailNotifications.sendNotifications(
          'jimmy@straightlinesource.com',
          'PowerHour',
          'PowerHour',
          'PowerHour',
          csv1
        );
      } else {
        emailNotifications.sendNotifications(
          'cgrippaldi@straightlinesource.com',
          'PowerHour',
          'There is no data for PowerHour'
        );
        emailNotifications.sendNotifications(
          'jimmy@straightlinesource.com',
          'PowerHour',
          'There is no data for PowerHour'
        );
      }

      if (sSingularData.length > 0) {
        //Recycle Senior
        let csv2 = new Parser().parse(sSingularData); //json2csvParser
        emailNotifications.sendNotifications(
          'cgrippaldi@straightlinesource.com',
          'Recycle Senior',
          'Recycle Senior',
          'Recycle_Senior',
          csv2
        );
        emailNotifications.sendNotifications(
          'jimmy@straightlinesource.com',
          'Recycle Senior',
          'Recycle Senior',
          'Recycle_Senior',
          csv2
        );
      } else {
        emailNotifications.sendNotifications(
          'cgrippaldi@straightlinesource.com',
          'Recycle Senior',
          'There is no data for Recycle Senior'
        );
        emailNotifications.sendNotifications(
          'jimmy@straightlinesource.com',
          'Recycle Senior',
          'There is no data for Recycle Senior'
        );
      }

      if (sPluralData.length > 0) {
        //Recycle Seniors
        let csv3 = new Parser().parse(sPluralData); //json2csvParser
        emailNotifications.sendNotifications(
          'cgrippaldi@straightlinesource.com',
          'Recycle Seniors',
          'Recycle Seniors',
          'Recycle_Seniors',
          csv3
        );
        emailNotifications.sendNotifications(
          'jimmy@straightlinesource.com',
          'Recycle Seniors',
          'Recycle Seniors',
          'Recycle_Seniors',
          csv3
        );
      } else {
        emailNotifications.sendNotifications(
          'cgrippaldi@straightlinesource.com',
          'Recycle Seniors',
          'There is no data for Recycle Seniors'
        );
        emailNotifications.sendNotifications(
          'jimmy@straightlinesource.com',
          'Recycle Seniors',
          'There is no data for Recycle Seniors'
        );
      }
    }
  });
}
//RecycleRicochet()
module.exports = RecycleRicochet;
