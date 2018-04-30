#!/bin/bash

echo "start checking out current temperatures"
let last=0
while /bin/true; do
  mtemp="`cat /sys/class/thermal/thermal_zone0/temp`"
  let diff=$mtemp-$last
  let mfare=$temp*18/10
  let mfare=$mfare+32000
  let fare=$mfare/1000
  let temp=$mtemp/1000
  DATE=`date +%R:%S`
  echo \[$DATE\] $mtemp mC \($mfare mF\) \(~$temp C, ~$fare F\). Delta $diff mC.
  let last=$mtemp
  sleep 1
done  
