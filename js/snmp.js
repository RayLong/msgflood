#! /usr/bin/nodejs
var exec=require('child_process').exec;
var agent=process.argv[2];
console.log("agent:", agent);
setInterval(function () {
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
 }, 60000);

