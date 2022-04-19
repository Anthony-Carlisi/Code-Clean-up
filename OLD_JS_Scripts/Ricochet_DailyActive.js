const moment = require('moment'),
  mssql = require('../JS_Helper/MSSQL_SEARCH'),
  rico = require('../JS_Helper/RICOCHET_HELPER');

var query = `SELECT Phone = CASE WHEN QuickApps.mobile IN('', NULL) OR LEN(QuickApps.mobile) < 10 THEN a.[Business Phone] ELSE QuickApps.mobile END from (select ROW_NUMBER() OVER(PARTITION BY MID ORDER BY [Update DateTime] DESC) as tt,* from vwAssignmentsAndUpdates)a INNER JOIN Businesses ON MID = Businesses.id INNER JOIN QuickApps ON MID = QuickApps.businessid where a.tt=1 AND (((a.Status = 'submitted' OR a.Status = 'approval' OR a.Status = 'contract out' OR a.Status = 'contract in') AND [Update DateTime] BETWEEN '${moment(
  Date.now()
)
  .subtract(45, 'days')
  .format('YYYY-MM-DD')}' AND '${moment(Date.now()).format(
  'YYYY-MM-DD'
)}')) ORDER BY CASE a.Status WHEN 'contract out' THEN 1 WHEN 'contract in' THEN 2 WHEN 'approval' THEN 3 WHEN 'submitted' THEN 4 ELSE 5 END`;

mssql.mssqlSearch(query).then((response) => {
  response.forEach((jsdata) => {
    //PowerHour
    rico
      .RicoAppOutDupBlock(jsdata.Phone)
      .then((res) => console.log(jsdata.Phone));
  });
});
