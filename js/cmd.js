var options = require('commander');
function parse()
{
  options
    .version('0.1')
    .option('--login_interval <s>', 'interval between login of users', Number, 0.1)
    .option('-u, --users <filename>', 'specify jid;host;password in a file', String, "users.txt")
    .option('-c, --contacts <filename>', 'specify jid of contact in a file', String, "contacts.txt")
    .option('--action_interval <s>', 'specify interval between xmpp actions', Number, 10)
    .option('--sub_interval <s>', 'specify interval between xmpp actions', Number, 0.2)
    .option('-t, --keepalive_timeout <s>', 'specify overall timeout', Number, 1)
    .option('-d, --data <data filename>', 'specify the filename for statistics data output', String, "data.txt")
  options.parse(process.argv);
}

exports.parse = parse;
exports.options = options;
