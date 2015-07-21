var Client = require('node-xmpp-client');
var LineReader = require('./lines').LineReader;
var ltx = require('node-xmpp-core').ltx;
var opt=require("./cmd");
var exec = require('child_process').exec;

opt.parse();

var clients=[];
var users=new LineReader(opt.options.users);
var contacts = new LineReader(opt.options.contacts);
var online_users = 0;
var const_action_interval = opt.options.action_interval;
var const_sub_interval = opt.options.sub_interval;
var const_login_interval = opt.options.login_interval;
var const_keepalive_timeout = opt.options.keepalive_timeout;
var stop_all = false;
var keepalive_timer=[];
var message_timer=[];

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
   
   {
     var to=contacts.readline();
     if(c.contact || c.state_machine) {
       console.log("variables exists!");
       proccess.exit(1);
     }
     c.contact = to;
     c.state_machine = 'roster';
   }
   var reconnect_number = 0;
   var my_index = 0;
   c.on('online', function() {
     if(reconnect_number == 0){
       console.log('i =',online_users,'is online. contact is ' + to );
       my_index = online_users;
       online_users+=1;

       var s = new ltx.Element('presence',{
          id:'pp:1'          });
       c.send(s);

       message_timer.push(setInterval(function(){
       if(c.state != 5){
         console.log(my_index, "offline, skip");
         return;
       }
       switch (c.state_machine){
         case 'msg':
           {
             var t = new Date/1000;
             var s = new ltx.Element('message',{
               to:c.contact, type:'chat', 
                 id:Math.floor(Math.random()*65535)
             }).c('timestamp').t(t.toString());
             c.send(s);
           }
         break;
         case 'presence':
         {
           var t = new Date/1000;
           var s = new ltx.Element('presence',{
             to:c.contact, type:'subscribe', 
               id:Math.floor(Math.random()*65535)
           }).c('timestamp').t(t.toString());
           c.send(s);
           console.log("subscribe", c.contact);
           c.state_machine = 'roster';
         }
         break;
         case 'roster':
         {
           var s = new ltx.Element('iq',{
             type:'get', 
             id:Math.floor(Math.random()*65535)
           }).c('query',{xmlns:"jabber:iq:roster"});
           c.send(s);
           console.log("get roster for", user[0]);
         }
         break;
       }
     },const_action_interval*1000));
     }else{
       console.log(my_index,'reconnected,',reconnect_number);
     }
     reconnect_number+=1;
   });

   c.on('stanza', function(stanza) {
     switch (stanza.name){
     case "presence":
     {
       if(stanza.attrs.type == "subscribe"){
         if(stanza.children[0].name=='timestamp'){
           var t=new Date/1000;
           var t0=stanza.children[0].text();
           console.log("pres delay:" + (t-t0).toString());
           var s=new ltx.Element('presence',
             {to:stanza.attrs.from,
               type:"subscribed", 
               id:Math.floor(Math.random()*65535)
             }
             );
           c.send(s);
         }
       }else if(stanza.attrs.type == "subscribed"){
         c.state_machine='msg';
         console.log(c.contact,"subscribed");
       }
     }
     break;
     case 'message':
     {
       if(stanza.attrs.type == 'chat'){
         if ( stanza.children[0].name == 'timestamp' ) {
           var t0=stanza.children[0].text();
           var t = new Date/1000;
           console.log("msg delay:", (t-t0).toString());
         }
       }
     }
     break;
     case 'iq':
     {
       var q=stanza.children[0];
       if( (q.name == 'query') && 
           (q.attrs.xmlns == 'jabber:iq:roster' )) {
             q.children.forEach(function (e) {
               if ((e.attrs.jid == c.contact) && 
                 (e.attrs.subscription != 'none')){
                   c.state_machine = 'msg';
                   console.log(c.contact,"subscribed");
                 }
             });
             if (c.state_machine != 'msg'){
               c.state_machine = 'presence';
             }
           }
     }
     break;
     default:
     break;
    } 
   });

   c.on('error', function(error) {
     console.log(user[0] + " Error happened:", error);
   });

   clients.push(c);
}

var g_timer = setInterval(login, const_login_interval*1000);
