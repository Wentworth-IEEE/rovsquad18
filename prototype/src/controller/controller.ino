/*
  controlStationTesting

  Takes input from a couple of joysticks for x, y, z, roll, pitch, yaw. Spits it out in JSON.
*/

// These constants won't change. They're used to give names to the pins used:
const int joy_S_Pin = A0;  // Analog input pin that the potentiometer is attached to
const int joy_F_Pin = A1;
const int joy_Y_Pin = A2;
const int joy_P_Pin = A3;
const int joy_U_Pin = A4;
const int joy_R_Pin = A5;

const int analogOutPin = 9; // Analog output pin that the LED is attached to

double joy_S = 0;
double joy_F = 0;
double joy_Y = 0;
double joy_P = 0;
double joy_U = 0;
double joy_R = 0;

double joy_S_last = 0;
double joy_F_last = 0;
double joy_Y_last = 0;
double joy_P_last = 0;
double joy_U_last = 0;
double joy_R_last = 0;

void setup() {
  // initialize serial communications at 9600 bps:
  Serial.begin(19200);
}

double dmap(long x, long in_min, long in_max, long out_min, long out_max)
{
  return (double) (x - in_min) * (double) (out_max - out_min) / (double) (in_max - in_min) + (double) out_min;
}

void loop() {
  // read the analog in value:
  joy_S = dmap(analogRead(joy_S_Pin), 0, 675, -1, 1);
  joy_F = dmap(analogRead(joy_F_Pin), 0, 675, -1, 1);
  joy_Y = dmap(analogRead(joy_Y_Pin), 0, 675, -1, 1);
  joy_P = dmap(analogRead(joy_P_Pin), 0, 675, -1, 1);
  joy_U = dmap(analogRead(joy_U_Pin), 0, 675, -1, 1);
  joy_R = dmap(analogRead(joy_R_Pin), 0, 675, -1, 1);

  if( !(joy_S < joy_S_last+.02 && joy_S > joy_S_last-.02) ||
      !(joy_F < joy_F_last+.02 && joy_F > joy_F_last-.02) ||
      !(joy_Y < joy_Y_last+.02 && joy_Y > joy_Y_last-.02) ||
      !(joy_P < joy_P_last+.02 && joy_P > joy_P_last-.02) ||
      !(joy_U < joy_U_last+.02 && joy_U > joy_U_last-.02) ||
      !(joy_R < joy_R_last+.02 && joy_R > joy_R_last-.02) ) {


    Serial.print("{\"joysticks\":[");

    Serial.print(joy_F, 6);

    Serial.print(",");
    Serial.print(joy_S, 6);

    Serial.print(",");
    Serial.print(joy_P, 6);

    Serial.print(",");
    Serial.print(joy_Y, 6);

    Serial.print(",");
    Serial.print(joy_R, 6);

    Serial.print(",");
    Serial.print(joy_U, 6);

    Serial.print("],\"buttons\":[0]}");
    Serial.print("\n");

    joy_S_last = joy_S;
    joy_F_last = joy_F;
    joy_Y_last = joy_Y;
    joy_P_last = joy_P;
    joy_U_last = joy_U;
    joy_R_last = joy_R;


   }

   //delay(2);

}
