var LineReader=require('./lines').LineReader

var options = require('commander');

function collect(a, memo){
  memo.push(a);
  return memo;
}

options
  .version('0.1')
  .option('-d, --dname <domainN>', 'specify the domain name', collect, [])
  .option('-i, --ip <ip address>', 'ip address', collect, [])
  .option('-f, --filename <filename>', 'user name and password')
  .option('-n, --number <N>', 'users for one group');

options.parse(process.argv);
console.log("options:", options);
var rawlines = new LineReader(options.filename);
var groups=options.dname.length;
var dname=options.dname;
var ips=options.ip;

if (groups != options.ip.length){
  console.log("how many domain and how many ip should be same");
  process.exit(1);
}

var fs=require('fs')
for(i_groups=0;i_groups<groups;i_groups++)
{
  var ufn='/tmp/u-'+i_groups.toString()+'.txt';
  var cfn='/tmp/c-'+i_groups.toString()+'.txt';
  var ufd,cfd;
  for(i_numbers=0;i_numbers<options.number;i_numbers++)
  {
    if (i_numbers==0){
      if(fs.existsSync(ufn)){
        fs.unlinkSync(ufn);
      }
      ufd=fs.openSync(ufn, 'w');
      if(fs.existsSync(cfn)){
        fs.unlinkSync(cfn);
      }
      cfd=fs.openSync(cfn,'w');
    }
    var ll=rawlines.readline();
    if (ll==''){
      console.log("users provided are not enough!");
      process.exit(1);
    }
    var user=ll.split(" ");
    fs.writeSync(ufd, user[0]+"@"+dname[i_groups]+
        ";"+ips[i_groups]+";"+user[1]+"\n");
    fs.writeSync(cfd, user[0]+"@"+dname[i_groups]+"\n");
  }
  fs.closeSync(ufd);
  fs.closeSync(cfd);
}


