#!/bin/bash
function local_tmux {
  tmux new -d -s "$1" "node $2 --users $3 --contacts $4 --login_interval $6 --action_interval 5 -t 30 >$5 2>&1"
}

function local_tmux_stop {
  tmux send-keys -t "$1" ^c
}

tmp_folder=/home/ray/ext/tmp

case $1 in
 'friend') 
     for x in {0..2}; do
       c_i=$(( ( $x + 1 ) % 3  ))
       local_tmux friend_$x /opt/msgflood/js/msg.js $tmp_folder/u-$x.txt $tmp_folder/c-$c_i.txt $tmp_folder/f"$x"_test.log 0.1
     done
     ;;

 'login') 
     for x in {0..2}; do
       c_i=$(( ( $x + 1 ) % 3  ))
       local_tmux friend_$x /opt/msgflood/js/login.js $tmp_folder/u-$x.txt $tmp_folder/c-$c_i.txt $tmp_folder/f"$x"_test.log 0.5
     done
     ;;

  'stop')
     for x in {0..2}; do
        local_tmux_stop friend_$x
     done
     rdate=$(date +"%Y%m%d-%H%M%S")
     mkdir -p $rdate
     cp $tmp_folder/f*_test.log $rdate/
  ;;
  
  'unfriend')
    for x in {0..2}; do
      c_i=$(( ( $x + 1 ) % 3  ))
      local_tmux unfriend_$x /opt/msgflood/js/roster.js /tmp/u-$x.txt /tmp/c-$c_i.txt /tmp/dontcare_$x.log 0.3
    done
  ;;
esac
