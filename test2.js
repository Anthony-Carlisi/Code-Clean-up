let test = {
  type: 3,
  body:
    'test 3[https://my-email-signature.link/signature.gif?u=575758&amp;e=202427460&amp;v=998de5a4bcad13f48802e0f1d52e2adef257bb1db6c7deec7c49bbb7d1e9be26]\n' +
    'On Mon, Jan 10, 2022 at 7:18 PM Anthony Carlisi <acarlisi@straightlinesource.com [acarlisi@straightlinesource.com]> wrote:\n' +
    '> test positive response\n' +
    '\n' +
    'On Mon, Jan 10, 2022 at 7:16 PM Anthony Carlisi <acarlisi@straightlinesource.com [acarlisi@straightlinesource.com]> wrote:\n' +
    '> test positive response\n' +
    'On Mon, Jan 10, 2022 at 7:16 PM Peter Tsikis <support@straightlinesource.com [support@straightlinesource.com]> wrote:\n' +
    '> test\n' +
    '\n' +
    '[https://msgsndr.com/smtp_email/event/opened/message/V6eiPTUkOkkeL3zL4H1X]\n' +
    '\n' +
    '\n' +
    '-- \n' +
    'Anthony Carlisi\n' +
    '\n' +
    'Marketing Director\n' +
    '\n' +
    'Office: 516-208-1200\n' +
    '\n' +
    'Direct: 516-279-3457\n' +
    '\n' +
    'acarlisi@straightlinesource.com\n' +
    '\n' +
    'Straight Line Source Logo [https://straightlinesource.com/wp-content/uploads/2020/12/SLS-Logo-for-Signatures.png]\n' +
    '\n' +
    'ONLINE APPLICATION [https://straightlinesource.com/apply/?fundingspecialist=Anthony%20Carlisi]\n' +
    '\n' +
    'CONFIDENTIALITY NOTICE: This e-mail may contain information that may be privileged and/or confidential. If you are not one of the\n' +
    'intended recipients or entities of this message, please notify the sender and immediately delete this email and all associated\n' +
    'attachments so that it is not recoverable. If you are not the intended recipient, any dissemination, distribution or copying of\n' +
    'this communication is prohibited.\n' +
    '\n' +
    '\n' +
    '\n' +
    '\n' +
    '-- \n' +
    'Anthony Carlisi\n' +
    '\n' +
    'Marketing Director\n' +
    '\n' +
    'Office: 516-208-1200\n' +
    '\n' +
    'Direct: 516-279-3457\n' +
    '\n' +
    'acarlisi@straightlinesource.com\n' +
    '\n' +
    'Straight Line Source Logo [https://straightlinesource.com/wp-content/uploads/2020/12/SLS-Logo-for-Signatures.png]\n' +
    '\n' +
    'ONLINE APPLICATION [https://straightlinesource.com/apply/?fundingspecialist=Anthony%20Carlisi]\n' +
    '\n' +
    'CONFIDENTIALITY NOTICE: This e-mail may contain information that may be privileged and/or confidential. If you are not one of the\n' +
    'intended recipients or entities of this message, please notify the sender and immediately delete this email and all associated\n' +
    'attachments so that it is not recoverable. If you are not the intended recipient, any dissemination, distribution or copying of\n' +
    'this communication is prohibited.\n' +
    '\n' +
    '\n' +
    '\n' +
    '\n' +
    '-- \n' +
    'Anthony Carlisi\n' +
    '\n' +
    'Marketing Director\n' +
    '\n' +
    'Office: 516-208-1200\n' +
    '\n' +
    'Direct: 516-279-3457\n' +
    '\n' +
    'acarlisi@straightlinesource.com\n' +
    '\n' +
    'Straight Line Source Logo [https://straightlinesource.com/wp-content/uploads/2020/12/SLS-Logo-for-Signatures.png]\n' +
    '\n' +
    'ONLINE APPLICATION [https://straightlinesource.com/apply/?fundingspecialist=Anthony%20Carlisi]\n' +
    '\n' +
    'CONFIDENTIALITY NOTICE: This e-mail may contain information that may be privileged and/or confidential. If you are not one of the\n' +
    'intended recipients or entities of this message, please notify the sender and immediately delete this email and all associated\n' +
    'attachments so that it is not recoverable. If you are not the intended recipient, any dissemination, distribution or copying of\n' +
    'this communication is prohibited.',
};

//console.log(test.body);
var firstLine = test.body.split('\n')[0].replace(/(\[.*?\])/g, '');
console.log(firstLine);
