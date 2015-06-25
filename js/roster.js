var Client = require('node-xmpp-client');
var LineReader = require('./lines').LineReader;
var ltx = require('node-xmpp-core').ltx;
var opt=require("./cmd");

opt.parse();
var clients=[];
var users=new LineReader(opt.options.users);
var contacts=new LineReader(opt.options.contacts);
var online_users = 0;
var const_login_interval = opt.options.login_interval;

function line_handler()
{
   var line = users.readline();
   if(line == '' ){
     clearInterval(g_timer);
     return ;
   }
   var user=line.split(";");
   console.log(user);   
   var c = new Client({
     jid: user[0],
     password: user[2],
     host: user[1]
   });

   var to = contacts.readline();

   c.on('online', function() {
     console.log(user[0],'is online');
     online_users+=1;
     var s=new ltx.Element('iq',{
       type:'set', id:Math.floor(Math.random()*65535)}).
       c(
         'query', {xmlns:'jabber:iq:roster'}).
       c(
         'item', {jid:to,subscription:'remove'});
     c.send(s);
   });

   c.on('stanza', function(stanza) {
     console.log("roster:", stanza.toString()); 
     c.end();
   });

   c.on('error', function(error) {
     console.log(user[0] + " Error happened:", error);
   });

   clients.push(c);
}

var g_timer = setInterval(line_handler, const_login_interval*1000);
