#!/usr/bin/env python
import socket
from lib import ms5837

TCP_IP = 'localhost'
TCP_PORT = 8083
BUFFER_SIZE = 2

sensor = ms5837.MS5837_30BA()
if not sensor.init():
    print('bar30 sensor could not be initialized')
    exit(1)

Pair = 1013.25  # Pascals
rho  = 998.23   # kg/m3
g    = 9.8      # m/s2

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.bind((TCP_IP, TCP_PORT))
s.listen(1)
print('PYTHON: listening at {}:{}'.format(TCP_IP, TCP_PORT))

conn, addr = s.accept()
while sensor.read():
    data = conn.recv(BUFFER_SIZE)
    if not data: break
    data = str(data).rstrip('\n')
    print('PYTHON: received: ', data)
    if data == 'D':
        response = (sensor.pressure() - Pair) * 100 / (rho * g)
    elif data == 'P':
        response = sensor.pressure()
    else:
        response = 'command not recognized'
    conn.send(str(response))
