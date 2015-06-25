var Client = require('node-xmpp-client');
var fs = require('fs');
var ltx = require('node-xmpp-core').ltx;

function LineReader(filename){
  this.fd = fs.openSync(filename,'r');
  this.read_buffer=new Buffer(4096);
  this.remaining = '';
  this.readline=function(){
    var line='';
    if(this.fd){
      var newline_pos = -1;
      do {
        newline_pos = this.remaining.indexOf('\n');
        if(newline_pos > -1){
          if( newline_pos > 0 ){
            line = this.remaining.substr(0,newline_pos);
          }
          if(newline_pos == (this.remaining.length - 1)) {
            this.remaining = '';
          } else {
            this.remaining = this.remaining.substr(newline_pos+1);
          }
        }else{
          var rl=fs.readSync(this.fd, this.read_buffer, 0, this.read_buffer.length, null);
          console.log("reading file");
          if (rl>0){
            this.remaining = this.remaining + this.read_buffer.toString('utf8', 0, rl); 
          }else{
            newline_pos = 0;
            console.log("nothing from file");
            if(this.remaining.length>0){
              line=this.remaining;
            }
            fs.closeSync(this.fd);
            this.fd = null;
          }
        }
      }while(newline_pos == -1);
    }
    return line;
  }
}
var opt=require("./cmd");
opt.parse();
var clients=[];
var users=new LineReader(opt.options.users);
var contacts = new LineReader(opt.options.contacts);
var online_users = 0;
var const_action_interval = opt.options.action_interval;
var const_login_interval = opt.options.login_interval;
var stop_all = false;
var keepalive_timer=[];
var message_timer=[];

setTimeout(function(){
  function clr(e){
    clearInterval(e);
  }
  keepalive_timer.forEach(clr);
  message_timer.forEach(clr);
  stop_all = true;
  console.log("Overall timeout!");
  clients.forEach(function(e){
    e.end();
  });
},opt.options.timeout*1000);

function line_handler()
{
   var line = users.readline();
   if(line == '' ){
     clearInterval(g_timer);
     setTimeout(function()
         {
           var index=0;
           console.log("successful login number =",online_users);
           var t=setInterval(function(){
             if(index==clients.length) {
               clearInterval(t);
               return;
             }
             var cc=clients[index];
             if(cc.contact){
               var timestamp=new Date/1000;
               var stanza = new ltx.Element(
                 'presence',
                 { to: cc.contact, type: 'subscribe', id: Math.floor(Math.random()*65535) }
                 ).t(timestamp.toString());
               cc.send(stanza);
               console.log("sending subscribe");
             }else{
               console.log(cc.jid.bare().toString(), "is offline");
             }
             index+=1;
           },const_action_interval*1000);
         }
     , 5000);
     return ;
   }
   var user=line.split(";");
   
   var c = new Client({
     jid: user[0],
     password: user[2],
     host: user[1]
   });

   var to=contacts.readline();
   c.contact = to;

   c.on('online', function() {
     console.log(user[0],'is online. contact is ' + to );
     online_users+=1;
     //keepalive
     keepalive_timer.push(setInterval(function()
       {
         var s=new ltx.Element('iq',{
           to:c.jid.domain, type:'get', id:Math.floor(Math.random()*65535)}).
           c('ping',{xmlns:'urn:xmpp:ping'});
         c.send(s);
       },50000));
   });

   c.on('stanza', function(stanza) {
     if(stanza.name=="presence"){
       if(stanza.attrs.type == "subscribe"){
         var t=new Date/1000;
         var t0=stanza.text();
         console.log("presence delay:" + (t-t0).toString());
         var s=new ltx.Element('presence',
           {to:stanza.attrs.from,
             type:"subscribed", 
             id:Math.floor(Math.random()*65535)
           }
           );
         c.send(s);
       }else if(stanza.attrs.type == "subscribed"){
         message_timer.push(setInterval(function(){
           var t = new Date/1000;
           var s = new ltx.Element('message',{
             to:to, type:'chat', 
               id:Math.floor(Math.random()*65535)
           }).c('timestamp').t(t.toString());
           
           c.send(s);

         },const_action_interval*1000));
       }
     }else if(stanza.name == 'message'){

       if(stanza.attrs.type == 'chat'){
         if ( stanza.children[0].name == 'timestamp' ) {
           
           var t0=stanza.children[0].text();
           var t = new Date/1000;

           console.log("message delay:", (t-t0).toString());
         }
       }
     }
   });

   c.on('error', function(error) {
     console.log(user[0] + " Error happened:", error);
   });

   clients.push(c);
}

var g_timer = setInterval(line_handler, const_login_interval*1000);
