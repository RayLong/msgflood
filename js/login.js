var Client = require('node-xmpp-client');
var LineReader = require('./lines').LineReader;
var ltx = require('node-xmpp-core').ltx;
var opt=require("./cmd");
var exec = require('child_process').exec;

opt.parse();

var clients=[];
var users=new LineReader(opt.options.users);
var online_users = 0;
var const_action_interval = opt.options.action_interval;
var const_sub_interval = opt.options.sub_interval;
var const_login_interval = opt.options.login_interval;
var const_keepalive_timeout = opt.options.keepalive_timeout;
var stop_all = false;
var keepalive_timer=[];

var snmp_agent = null;

function snmp_monitor(agent)
{
  var c1='snmpwalk -v2c -cpublic ';
  var c2=[/*CPU idle*/' .1.3.6.1.4.1.2021.11.11.0',
      /*CPU load 1min*/' .1.3.6.1.4.1.2021.10.1.3.1',
      /*free mem*/' .1.3.6.1.4.1.2021.4.11.0'];
  var date=(new Date).toISOString();
  c2.forEach(function (e) {
    exec(c1+agent+e, function(err, stdout, stderr){
      console.log(date, ':', stdout);
    });
  });
}

function login()
{
   var line = users.readline();
   if(line == '' ){
     clearInterval(g_timer);
     return ;
   }
   
   var user=line.split(";");
   
   var c = new Client({
     jid: user[0],
     password: user[2],
     host: user[1],
     reconnect:true
   });

   if(!snmp_agent){
     snmp_agent=user[1];
     setInterval(snmp_monitor, 60000, snmp_agent);
   }

   var reconnect_number = 0;
   
   var stanza_id = 0;
   
   c.on('online', function() {
     if(reconnect_number == 0){
       console.log(user[0],'is online');
       setTimeout(function(){
         var s = new ltx.Element('presence',{
           id:'presence:' + stanza_id
         });
         stanza_id += 1;
         c.send(s);
       },1000);
       keepalive_timer.push( setInterval( function(){
         if(c.state!=5) {
           console.log(user[0],'offline, skip');
           return;
         }
         //<iq type='get' id='keepalive:4690'><query xmlns='eyeball:keepalive'/></iq>
         var s = new ltx.Element('iq',{
           type:'get', 
           id:'keepalive:' + stanza_id
         }).c('query',{xmlns:'eyeball:keepalive'});
         stanza_id += 1;
         c.send(s);
       }, const_keepalive_timeout * 1000));
       online_users += 1;
       console.log('current users:', online_users);
     }else{
       console.log(user[0],'reconnected,',reconnect_number);
     }
     reconnect_number += 1;
   });

   c.on('stanza', function(stanza) {
     console.log(user[0],"got ret:", stanza.toString());
   });

   c.on('error', function(error) {
     console.log(user[0] + " Error happened:", error);
   });

   clients.push(c);
}

var g_timer = setInterval(login, const_login_interval*1000);
