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

   c.on('online', function() {
     console.log(user[0],'is online');
     online_users+=1;
     var s=new ltx.Element('iq',{
       type:'get', id:Math.floor(Math.random()*65535)}).
       c('query',{xmlns:'jabber:iq:roster'});
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
