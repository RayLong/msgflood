npm install commander node-xmpp-client@1.0.0-alpha20 node-xmpp-core@1.0.0-alpha14 sazzle@0.0.8 node-stringprep
for x in *.patch ; do patch -p0 <  $x; done
