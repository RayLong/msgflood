var fs = require('fs');

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

exports.LineReader = LineReader;
