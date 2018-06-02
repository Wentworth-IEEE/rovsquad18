#!/bin/bash
now=`date +%F_%R`
cnow=$now".csv"
pnow=$now".png"
mv zlog.csv ./oldlogs/$cnow
mv zout.png ./oldLogs/$pnow
scp root@deepfriednug.local:/opt/zlog/zlog.csv zlog.csv
R CMD BATCH zlog2graph.r
