var mysql = require('mysql');
const axios = require('axios');
var moment = require('moment');

async function RicoCallToDB() {
  var fromToday = moment(Date.now())
    .add(1, 'hours')
    .subtract(2, 'minutes')
    .format('YYYY-MM-DD HH:mm:00');

  var toToday = moment(Date.now())
    .add(1, 'hours')
    .subtract(1, 'minutes')
    .format('YYYY-MM-DD HH:mm:00');
  //console.log('From: '+fromToday+' - To: '+toToday)

  const config = {
    method: 'get',
    url: 'https://sls.ricochet.me/api/v4/reports/call_history',
    headers: {
      'X-Auth-Token':
        'cImmWdGz7YdpetM7qdy51Ss7mBCnZei47BlY1T9DOjgNBvwGpdIlQc0i9bdl',
    },
    params: { from: fromToday, to: toToday },
  };

  //mysql connection setup
  var connection = mysql.createConnection({
    host: '50.116.63.194',
    port: '3306',
    user: 'admin',
    password: 'P@$$w0rd321@AC',
    database: 'ricochet',
    multipleStatements: true,
  });

  let res = await axios(config);
  var numPages = res.data.data.calls.last_page;
  var a = 1;
  while (a <= numPages) {
    const config = {
      method: 'get',
      url: 'https://sls.ricochet.me/api/v4/reports/call_history',
      headers: {
        'X-Auth-Token':
          'cImmWdGz7YdpetM7qdy51Ss7mBCnZei47BlY1T9DOjgNBvwGpdIlQc0i9bdl',
      },
      params: { from: fromToday, to: toToday, page: a },
    };
    let res = await axios(config);
    a++;
    const obj = res.data.data.calls.data;
    obj.forEach((jsdata) => {
      if (jsdata.campaign_skinny == null) {
        if (typeof jsdata.tags == 'undefined') {
          var sql =
            'INSERT INTO call_history (id, transferred, agent_name, phone2, phone3, scheduled_for, lead_name, transfer_to, transfer_finish, phone1, office_id, transfer_from, call_status, outbound, scheduled_for_archive, hijacked_by_call_id, current_status_id, lead_tags, campaign_id, hijacked_a_call, external_crm_lead_id, triggered_voicemail, main_state_id, call_queue_id, main_state, CallUUID, Duration, vendorName, campaign_skinny, predictive_call_status_id, lead_created_at, firstName, date_added, ChildCallSid, call_type_id, user_id, transfer_to_id, phone, caller_id, vendor_id, has_restricted_tags, name, transfer_start, lastName, deleted_lead, created_at, ivr_phone_name, call_from, call_duration, state_routed, used_perfect_voicemail, transfer_time, updated_at, statused_lead, transfer_from_id, preview_dialing, lead_id, inbound_state, HangupCause, lead_email, company_id, status_name, CallStatus, transfer_status, team, call_date, drip_dial_call_number, has_warning, to_number, current_lead_owner_id, ivr_phone_description, call_type) VALUES ?';
          var values = [
            [
              jsdata.id,
              jsdata.transferred,
              jsdata.agent_name,
              jsdata.phone2,
              jsdata.phone3,
              jsdata.scheduled_for,
              jsdata.lead_name,
              jsdata.transfer_to,
              jsdata.transfer_finish,
              jsdata.phone1,
              jsdata.office_id,
              jsdata.transfer_from,
              jsdata.call_status,
              jsdata.outbound,
              jsdata.scheduled_for_archive,
              jsdata.hijacked_by_call_id,
              jsdata.current_status_id,
              jsdata.lead_tags,
              jsdata.campaign_id,
              jsdata.hijacked_a_call,
              jsdata.external_crm_lead_id,
              jsdata.triggered_voicemail,
              jsdata.main_state_id,
              jsdata.call_queue_id,
              jsdata.main_state,
              jsdata.CallUUID,
              jsdata.Duration,
              jsdata.vendorName,
              jsdata.campaign_skinny,
              jsdata.predictive_call_status_id,
              jsdata.lead_created_at,
              jsdata.firstName,
              jsdata.date_added,
              jsdata.ChildCallSid,
              jsdata.call_type_id,
              jsdata.user_id,
              jsdata.transfer_to_id,
              jsdata.phone,
              jsdata.caller_id,
              jsdata.vendor_id,
              jsdata.has_restricted_tags,
              jsdata.name,
              jsdata.transfer_start,
              jsdata.lastName,
              jsdata.deleted_lead,
              jsdata.created_at,
              jsdata.ivr_phone_name,
              jsdata.call_from,
              jsdata.call_duration,
              jsdata.state_routed,
              jsdata.used_perfect_voicemail,
              jsdata.transfer_time,
              jsdata.updated_at,
              jsdata.statused_lead,
              jsdata.transfer_from_id,
              jsdata.preview_dialing,
              jsdata.lead_id,
              jsdata.inbound_state,
              jsdata.HangupCause,
              jsdata.lead_email,
              jsdata.company_id,
              jsdata.status_name,
              jsdata.CallStatus,
              jsdata.transfer_status,
              jsdata.team,
              jsdata.call_date,
              jsdata.drip_dial_call_number,
              jsdata.has_warning,
              jsdata.to,
              jsdata.current_lead_owner_id,
              jsdata.ivr_phone_description,
              jsdata.call_type,
            ],
          ];
          connection.query(sql, [values], function (err) {
            if (err & (err != 'ER_DUP_ENTRY')) {
              console.log('Error');
            }
          });
        } else if (typeof jsdata.tags[0] == 'undefined') {
          var sql =
            'INSERT INTO call_history (id, transferred, agent_name, phone2, phone3, scheduled_for, lead_name, transfer_to, transfer_finish, phone1, office_id, transfer_from, call_status, outbound, scheduled_for_archive, hijacked_by_call_id, current_status_id, lead_tags, campaign_id, hijacked_a_call, external_crm_lead_id, triggered_voicemail, main_state_id, call_queue_id, main_state, CallUUID, Duration, vendorName, campaign_skinny, predictive_call_status_id, lead_created_at, firstName, date_added, ChildCallSid, call_type_id, user_id, transfer_to_id, phone, caller_id, vendor_id, has_restricted_tags, name, transfer_start, lastName, deleted_lead, created_at, ivr_phone_name, call_from, call_duration, state_routed, used_perfect_voicemail, transfer_time, updated_at, statused_lead, transfer_from_id, preview_dialing, lead_id, inbound_state, HangupCause, lead_email, company_id, status_name, CallStatus, transfer_status, team, call_date, drip_dial_call_number, has_warning, to_number, current_lead_owner_id, ivr_phone_description, call_type) VALUES ?';
          var values = [
            [
              jsdata.id,
              jsdata.transferred,
              jsdata.agent_name,
              jsdata.phone2,
              jsdata.phone3,
              jsdata.scheduled_for,
              jsdata.lead_name,
              jsdata.transfer_to,
              jsdata.transfer_finish,
              jsdata.phone1,
              jsdata.office_id,
              jsdata.transfer_from,
              jsdata.call_status,
              jsdata.outbound,
              jsdata.scheduled_for_archive,
              jsdata.hijacked_by_call_id,
              jsdata.current_status_id,
              jsdata.lead_tags,
              jsdata.campaign_id,
              jsdata.hijacked_a_call,
              jsdata.external_crm_lead_id,
              jsdata.triggered_voicemail,
              jsdata.main_state_id,
              jsdata.call_queue_id,
              jsdata.main_state,
              jsdata.CallUUID,
              jsdata.Duration,
              jsdata.vendorName,
              jsdata.campaign_skinny,
              jsdata.predictive_call_status_id,
              jsdata.lead_created_at,
              jsdata.firstName,
              jsdata.date_added,
              jsdata.ChildCallSid,
              jsdata.call_type_id,
              jsdata.user_id,
              jsdata.transfer_to_id,
              jsdata.phone,
              jsdata.caller_id,
              jsdata.vendor_id,
              jsdata.has_restricted_tags,
              jsdata.name,
              jsdata.transfer_start,
              jsdata.lastName,
              jsdata.deleted_lead,
              jsdata.created_at,
              jsdata.ivr_phone_name,
              jsdata.call_from,
              jsdata.call_duration,
              jsdata.state_routed,
              jsdata.used_perfect_voicemail,
              jsdata.transfer_time,
              jsdata.updated_at,
              jsdata.statused_lead,
              jsdata.transfer_from_id,
              jsdata.preview_dialing,
              jsdata.lead_id,
              jsdata.inbound_state,
              jsdata.HangupCause,
              jsdata.lead_email,
              jsdata.company_id,
              jsdata.status_name,
              jsdata.CallStatus,
              jsdata.transfer_status,
              jsdata.team,
              jsdata.call_date,
              jsdata.drip_dial_call_number,
              jsdata.has_warning,
              jsdata.to,
              jsdata.current_lead_owner_id,
              jsdata.ivr_phone_description,
              jsdata.call_type,
            ],
          ];
          connection.query(sql, [values], function (err) {
            if (err & (err != 'ER_DUP_ENTRY')) {
              console.log('Error');
            }
          });
        } else {
          var sql =
            'INSERT INTO call_history (id, transferred, agent_name, phone2, phone3, scheduled_for, lead_name, transfer_to, transfer_finish, phone1, office_id, transfer_from, call_status, outbound, scheduled_for_archive, hijacked_by_call_id, current_status_id, lead_tags, campaign_id, hijacked_a_call, external_crm_lead_id, triggered_voicemail, main_state_id, call_queue_id, main_state, CallUUID, Duration, vendorName, campaign_skinny, tags, predictive_call_status_id, lead_created_at, firstName, date_added, ChildCallSid, call_type_id, user_id, transfer_to_id, phone, caller_id, vendor_id, has_restricted_tags, name, transfer_start, lastName, deleted_lead, created_at, ivr_phone_name, call_from, call_duration, state_routed, used_perfect_voicemail, transfer_time, updated_at, statused_lead, transfer_from_id, preview_dialing, lead_id, inbound_state, HangupCause, lead_email, company_id, status_name, CallStatus, transfer_status, team, call_date, drip_dial_call_number, has_warning, to_number, current_lead_owner_id, ivr_phone_description, call_type) VALUES ?';
          var values = [
            [
              jsdata.id,
              jsdata.transferred,
              jsdata.agent_name,
              jsdata.phone2,
              jsdata.phone3,
              jsdata.scheduled_for,
              jsdata.lead_name,
              jsdata.transfer_to,
              jsdata.transfer_finish,
              jsdata.phone1,
              jsdata.office_id,
              jsdata.transfer_from,
              jsdata.call_status,
              jsdata.outbound,
              jsdata.scheduled_for_archive,
              jsdata.hijacked_by_call_id,
              jsdata.current_status_id,
              jsdata.lead_tags,
              jsdata.campaign_id,
              jsdata.hijacked_a_call,
              jsdata.external_crm_lead_id,
              jsdata.triggered_voicemail,
              jsdata.main_state_id,
              jsdata.call_queue_id,
              jsdata.main_state,
              jsdata.CallUUID,
              jsdata.Duration,
              jsdata.vendorName,
              jsdata.campaign_skinny,
              jsdata.tags[0].label,
              jsdata.predictive_call_status_id,
              jsdata.lead_created_at,
              jsdata.firstName,
              jsdata.date_added,
              jsdata.ChildCallSid,
              jsdata.call_type_id,
              jsdata.user_id,
              jsdata.transfer_to_id,
              jsdata.phone,
              jsdata.caller_id,
              jsdata.vendor_id,
              jsdata.has_restricted_tags,
              jsdata.name,
              jsdata.transfer_start,
              jsdata.lastName,
              jsdata.deleted_lead,
              jsdata.created_at,
              jsdata.ivr_phone_name,
              jsdata.call_from,
              jsdata.call_duration,
              jsdata.state_routed,
              jsdata.used_perfect_voicemail,
              jsdata.transfer_time,
              jsdata.updated_at,
              jsdata.statused_lead,
              jsdata.transfer_from_id,
              jsdata.preview_dialing,
              jsdata.lead_id,
              jsdata.inbound_state,
              jsdata.HangupCause,
              jsdata.lead_email,
              jsdata.company_id,
              jsdata.status_name,
              jsdata.CallStatus,
              jsdata.transfer_status,
              jsdata.team,
              jsdata.call_date,
              jsdata.drip_dial_call_number,
              jsdata.has_warning,
              jsdata.to,
              jsdata.current_lead_owner_id,
              jsdata.ivr_phone_description,
              jsdata.call_type,
            ],
          ];
          connection.query(sql, [values], function (err) {
            if (err & (err != 'ER_DUP_ENTRY')) {
              console.log('Error');
            }
          });
        }
      } else {
        if (typeof jsdata.tags == 'undefined') {
          var sql =
            'INSERT INTO call_history (id, transferred, agent_name, phone2, phone3, scheduled_for, lead_name, transfer_to, transfer_finish, phone1, office_id, transfer_from, call_status, outbound, scheduled_for_archive, hijacked_by_call_id, current_status_id, lead_tags, campaign_id, hijacked_a_call, external_crm_lead_id, triggered_voicemail, main_state_id, call_queue_id, main_state, CallUUID, Duration, vendorName, campaign_skinny, predictive_call_status_id, lead_created_at, firstName, date_added, ChildCallSid, call_type_id, user_id, transfer_to_id, phone, caller_id, vendor_id, has_restricted_tags, name, transfer_start, lastName, deleted_lead, created_at, ivr_phone_name, call_from, call_duration, state_routed, used_perfect_voicemail, transfer_time, updated_at, statused_lead, transfer_from_id, preview_dialing, lead_id, inbound_state, HangupCause, lead_email, company_id, status_name, CallStatus, transfer_status, team, call_date, drip_dial_call_number, has_warning, to_number, current_lead_owner_id, ivr_phone_description, call_type) VALUES ?';
          var values = [
            [
              jsdata.id,
              jsdata.transferred,
              jsdata.agent_name,
              jsdata.phone2,
              jsdata.phone3,
              jsdata.scheduled_for,
              jsdata.lead_name,
              jsdata.transfer_to,
              jsdata.transfer_finish,
              jsdata.phone1,
              jsdata.office_id,
              jsdata.transfer_from,
              jsdata.call_status,
              jsdata.outbound,
              jsdata.scheduled_for_archive,
              jsdata.hijacked_by_call_id,
              jsdata.current_status_id,
              jsdata.lead_tags,
              jsdata.campaign_id,
              jsdata.hijacked_a_call,
              jsdata.external_crm_lead_id,
              jsdata.triggered_voicemail,
              jsdata.main_state_id,
              jsdata.call_queue_id,
              jsdata.main_state,
              jsdata.CallUUID,
              jsdata.Duration,
              jsdata.vendorName,
              jsdata.campaign_skinny.name,
              jsdata.predictive_call_status_id,
              jsdata.lead_created_at,
              jsdata.firstName,
              jsdata.date_added,
              jsdata.ChildCallSid,
              jsdata.call_type_id,
              jsdata.user_id,
              jsdata.transfer_to_id,
              jsdata.phone,
              jsdata.caller_id,
              jsdata.vendor_id,
              jsdata.has_restricted_tags,
              jsdata.name,
              jsdata.transfer_start,
              jsdata.lastName,
              jsdata.deleted_lead,
              jsdata.created_at,
              jsdata.ivr_phone_name,
              jsdata.call_from,
              jsdata.call_duration,
              jsdata.state_routed,
              jsdata.used_perfect_voicemail,
              jsdata.transfer_time,
              jsdata.updated_at,
              jsdata.statused_lead,
              jsdata.transfer_from_id,
              jsdata.preview_dialing,
              jsdata.lead_id,
              jsdata.inbound_state,
              jsdata.HangupCause,
              jsdata.lead_email,
              jsdata.company_id,
              jsdata.status_name,
              jsdata.CallStatus,
              jsdata.transfer_status,
              jsdata.team,
              jsdata.call_date,
              jsdata.drip_dial_call_number,
              jsdata.has_warning,
              jsdata.to,
              jsdata.current_lead_owner_id,
              jsdata.ivr_phone_description,
              jsdata.call_type,
            ],
          ];
          connection.query(sql, [values], function (err) {
            if (err & (err != 'ER_DUP_ENTRY')) {
              console.log('Error');
            }
          });
        } else if (typeof jsdata.tags[0] == 'undefined') {
          var sql =
            'INSERT INTO call_history (id, transferred, agent_name, phone2, phone3, scheduled_for, lead_name, transfer_to, transfer_finish, phone1, office_id, transfer_from, call_status, outbound, scheduled_for_archive, hijacked_by_call_id, current_status_id, lead_tags, campaign_id, hijacked_a_call, external_crm_lead_id, triggered_voicemail, main_state_id, call_queue_id, main_state, CallUUID, Duration, vendorName, campaign_skinny, predictive_call_status_id, lead_created_at, firstName, date_added, ChildCallSid, call_type_id, user_id, transfer_to_id, phone, caller_id, vendor_id, has_restricted_tags, name, transfer_start, lastName, deleted_lead, created_at, ivr_phone_name, call_from, call_duration, state_routed, used_perfect_voicemail, transfer_time, updated_at, statused_lead, transfer_from_id, preview_dialing, lead_id, inbound_state, HangupCause, lead_email, company_id, status_name, CallStatus, transfer_status, team, call_date, drip_dial_call_number, has_warning, to_number, current_lead_owner_id, ivr_phone_description, call_type) VALUES ?';
          var values = [
            [
              jsdata.id,
              jsdata.transferred,
              jsdata.agent_name,
              jsdata.phone2,
              jsdata.phone3,
              jsdata.scheduled_for,
              jsdata.lead_name,
              jsdata.transfer_to,
              jsdata.transfer_finish,
              jsdata.phone1,
              jsdata.office_id,
              jsdata.transfer_from,
              jsdata.call_status,
              jsdata.outbound,
              jsdata.scheduled_for_archive,
              jsdata.hijacked_by_call_id,
              jsdata.current_status_id,
              jsdata.lead_tags,
              jsdata.campaign_id,
              jsdata.hijacked_a_call,
              jsdata.external_crm_lead_id,
              jsdata.triggered_voicemail,
              jsdata.main_state_id,
              jsdata.call_queue_id,
              jsdata.main_state,
              jsdata.CallUUID,
              jsdata.Duration,
              jsdata.vendorName,
              jsdata.campaign_skinny,
              jsdata.predictive_call_status_id,
              jsdata.lead_created_at,
              jsdata.firstName,
              jsdata.date_added,
              jsdata.ChildCallSid,
              jsdata.call_type_id,
              jsdata.user_id,
              jsdata.transfer_to_id,
              jsdata.phone,
              jsdata.caller_id,
              jsdata.vendor_id,
              jsdata.has_restricted_tags,
              jsdata.name,
              jsdata.transfer_start,
              jsdata.lastName,
              jsdata.deleted_lead,
              jsdata.created_at,
              jsdata.ivr_phone_name,
              jsdata.call_from,
              jsdata.call_duration,
              jsdata.state_routed,
              jsdata.used_perfect_voicemail,
              jsdata.transfer_time,
              jsdata.updated_at,
              jsdata.statused_lead,
              jsdata.transfer_from_id,
              jsdata.preview_dialing,
              jsdata.lead_id,
              jsdata.inbound_state,
              jsdata.HangupCause,
              jsdata.lead_email,
              jsdata.company_id,
              jsdata.status_name,
              jsdata.CallStatus,
              jsdata.transfer_status,
              jsdata.team,
              jsdata.call_date,
              jsdata.drip_dial_call_number,
              jsdata.has_warning,
              jsdata.to,
              jsdata.current_lead_owner_id,
              jsdata.ivr_phone_description,
              jsdata.call_type,
            ],
          ];
          connection.query(sql, [values], function (err) {
            if (err & (err != 'ER_DUP_ENTRY')) {
              console.log('Error');
            }
          });
        } else {
          var sql =
            'INSERT INTO call_history (id, transferred, agent_name, phone2, phone3, scheduled_for, lead_name, transfer_to, transfer_finish, phone1, office_id, transfer_from, call_status, outbound, scheduled_for_archive, hijacked_by_call_id, current_status_id, lead_tags, campaign_id, hijacked_a_call, external_crm_lead_id, triggered_voicemail, main_state_id, call_queue_id, main_state, CallUUID, Duration, vendorName, campaign_skinny, tags, predictive_call_status_id, lead_created_at, firstName, date_added, ChildCallSid, call_type_id, user_id, transfer_to_id, phone, caller_id, vendor_id, has_restricted_tags, name, transfer_start, lastName, deleted_lead, created_at, ivr_phone_name, call_from, call_duration, state_routed, used_perfect_voicemail, transfer_time, updated_at, statused_lead, transfer_from_id, preview_dialing, lead_id, inbound_state, HangupCause, lead_email, company_id, status_name, CallStatus, transfer_status, team, call_date, drip_dial_call_number, has_warning, to_number, current_lead_owner_id, ivr_phone_description, call_type) VALUES ?';
          var values = [
            [
              jsdata.id,
              jsdata.transferred,
              jsdata.agent_name,
              jsdata.phone2,
              jsdata.phone3,
              jsdata.scheduled_for,
              jsdata.lead_name,
              jsdata.transfer_to,
              jsdata.transfer_finish,
              jsdata.phone1,
              jsdata.office_id,
              jsdata.transfer_from,
              jsdata.call_status,
              jsdata.outbound,
              jsdata.scheduled_for_archive,
              jsdata.hijacked_by_call_id,
              jsdata.current_status_id,
              jsdata.lead_tags,
              jsdata.campaign_id,
              jsdata.hijacked_a_call,
              jsdata.external_crm_lead_id,
              jsdata.triggered_voicemail,
              jsdata.main_state_id,
              jsdata.call_queue_id,
              jsdata.main_state,
              jsdata.CallUUID,
              jsdata.Duration,
              jsdata.vendorName,
              jsdata.campaign_skinny.name,
              jsdata.tags[0].label,
              jsdata.predictive_call_status_id,
              jsdata.lead_created_at,
              jsdata.firstName,
              jsdata.date_added,
              jsdata.ChildCallSid,
              jsdata.call_type_id,
              jsdata.user_id,
              jsdata.transfer_to_id,
              jsdata.phone,
              jsdata.caller_id,
              jsdata.vendor_id,
              jsdata.has_restricted_tags,
              jsdata.name,
              jsdata.transfer_start,
              jsdata.lastName,
              jsdata.deleted_lead,
              jsdata.created_at,
              jsdata.ivr_phone_name,
              jsdata.call_from,
              jsdata.call_duration,
              jsdata.state_routed,
              jsdata.used_perfect_voicemail,
              jsdata.transfer_time,
              jsdata.updated_at,
              jsdata.statused_lead,
              jsdata.transfer_from_id,
              jsdata.preview_dialing,
              jsdata.lead_id,
              jsdata.inbound_state,
              jsdata.HangupCause,
              jsdata.lead_email,
              jsdata.company_id,
              jsdata.status_name,
              jsdata.CallStatus,
              jsdata.transfer_status,
              jsdata.team,
              jsdata.call_date,
              jsdata.drip_dial_call_number,
              jsdata.has_warning,
              jsdata.to,
              jsdata.current_lead_owner_id,
              jsdata.ivr_phone_description,
              jsdata.call_type,
            ],
          ];
          connection.query(sql, [values], function (err) {
            if (err & (err != 'ER_DUP_ENTRY')) {
              console.log('Error');
            }
          });
        }
      }
    });
  }
  connection.end();
}

module.exports = RicoCallToDB;
//RicoCallToDB()
