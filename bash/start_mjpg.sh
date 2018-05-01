#!/bin/bash
# Starts the MJPG_stream stuff- 
# A stream will appear on 8081, using the best settings I could figure for low latency/stalling.
mjpg_streamer -i 'input_uvc.so -softfps 15 -d /dev/video0 -q 100' -o 'output_http.so -p 8081'
# This one does the Pi
mjpg_streamer -i 'input_raspicam.so -q 25 -fps 25' -o 'output_http.so -p 8082'

