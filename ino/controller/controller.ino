/*
  controlStationTesting

  Takes input from a couple of joysticks for x, y, z, roll, pitch, yaw. Spits it out in JSON.
*/

// These constants won't change. They're used to give names to the pins used:
/*
 * S is for Strafe
 * F is for Forwards
 * Y is for Yaw
 * P is for Pitch
 * U is for Up/Down (elevation)
 * R is for Roll
 */


const int joy_Y_Pin = A0;  // Analog input pin that the potentiometer is attached to
const int joy_P_Pin = A1;
const int joy_S_Pin = A2;
const int joy_F_Pin = A3;
const int joy_E_Pin = A4;
const int joy_C_Pin = A5;

const int analogOutPin = 9; // Analog output pin that the LED is attached to

double joy_S = 0;
double joy_F = 0;
double joy_Y = 0;
double joy_P = 0;
double joy_E = 0;
double joy_C = 0;

double joy_S_last = 0;
double joy_F_last = 0;
double joy_Y_last = 0;
double joy_P_last = 0;
double joy_E_last = 0;
double joy_C_last = 0;

void setup() {
  // initialize serial communications at 9600 bps:
  Serial.begin(19200);
}

double dmap(long x, long in_min, long in_max, long out_min, long out_max)
{
  return (double) (x - in_min) * (double) (out_max - out_min) / (double) (in_max - in_min) + (double) out_min;
}

double joy_S_off = 0;//dmap(analogRead(joy_S_Pin), 0, 675, -1, 1);
double joy_F_off = 0;//dmap(analogRead(joy_F_Pin), 0, 675, -1, 1);
double joy_Y_off = 0;//dmap(analogRead(joy_Y_Pin), 0, 675, -1, 1);
double joy_P_off = 0;//dmap(analogRead(joy_P_Pin), 0, 675, -1, 1);
double joy_E_off = 0;//dmap(analogRead(joy_E_Pin), 0, 675, -1, 1);
double joy_C_off = 0;//dmap(analogRead(joy_C_Pin), 0, 675, -1, 1);

void loop() {
  
  // read the analog in value:
  joy_S = dmap(analogRead(joy_S_Pin), 0, 675, -1, 1);
  joy_F = dmap(analogRead(joy_F_Pin), 0, 675, -1, 1);
  joy_Y = dmap(analogRead(joy_Y_Pin), 0, 675, -1, 1);
  joy_P = dmap(analogRead(joy_P_Pin), 0, 675, -1, 1);
  joy_E = dmap(analogRead(joy_E_Pin), 0, 675, -1, 1);
  joy_C = dmap(analogRead(joy_C_Pin), 0, 675, -1, 1);

  if( !(joy_S < joy_S_last+.02 && joy_S > joy_S_last-.02) ||
      !(joy_F < joy_F_last+.02 && joy_F > joy_F_last-.02) ||
      !(joy_Y < joy_Y_last+.02 && joy_Y > joy_Y_last-.02) ||
      !(joy_P < joy_P_last+.02 && joy_P > joy_P_last-.02) ||
      !(joy_E < joy_E_last+.02 && joy_E > joy_E_last-.02) ||
      !(joy_C < joy_C_last+.02 && joy_C > joy_C_last-.02) ) {

    Serial.print("{\"joysticks\":[");

    Serial.print(joy_F-joy_F_off, 6);

    Serial.print(",");
    Serial.print(joy_S-joy_S_off, 6);

    Serial.print(",");
    Serial.print(joy_P-joy_P_off, 6);

    Serial.print(",");
    Serial.print(joy_Y-joy_Y_off, 6);

    Serial.print(",");
    Serial.print(joy_C-joy_C_off, 6);

    Serial.print(",");
    Serial.print(joy_E-joy_E_off, 6);

    // TODO: make button not static

    Serial.print("],\"buttons\":[0]}");
    Serial.print("\n");

    joy_S_last = joy_S;
    joy_F_last = joy_F;
    joy_Y_last = joy_Y;
    joy_P_last = joy_P;
    joy_E_last = joy_E;
    joy_C_last = joy_C;


   }

   //delay(2);

}
