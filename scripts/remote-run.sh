#!/bin/bash
function remote_tmux {
  ssh $1 "tmux new -d -s \"$2\" \"node $3 --users $4 --contacts $5 --login_interval $7 --sub_interval 1 --action_interval 30 | tee $6\""
}

function remote_stop {
  ssh $1 "tmux send-keys -t \"$2\" ^c"
}

case $1 in
  'users')
    m=0
    for x in $2 $3 $4; do
      scp /tmp/u-$m.txt $x:/tmp/u-s.txt
      scp /tmp/c-$(( ( $m + 1 ) % 3 )).txt $x:/tmp/c-s.txt
      m=$(( $m + 1 ))
    done 
    ;;

 'friend') 
     for x in $2 $3 $4 ; do
       remote_tmux $x friend /opt/msgflood/js/msg.js /tmp/u-s.txt /tmp/c-s.txt /tmp/test.log 0.1
     done
     ;;

  'stop')
     for x in $2 $3 $4 ; do
        remote_stop $x friend
     done
     sleep 1
     for x in $2 $3 $4 ; do
        scp $x:/tmp/test.log $x"_test.log"
     done
  ;;
  
  'unfriend')
    for x in $2 $3 $4 ; do
      remote_tmux $x unfriend /opt/msgflood/js/roster.js /tmp/u-s.txt /tmp/c-s.txt /tmp/dontcare.log 0.3
    done
  ;;
esac
