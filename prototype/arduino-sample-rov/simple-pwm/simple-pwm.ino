
/* NOTE: This code requires the "Arduino_I2C_ESC" library in order to operate.
-------------------------------

Title: simple-pwm (Arduino)

Description: This code is a modified version of the Basic_I2C_ESC code produced
by Blue Robotics. The modifications herein allow for multiple ESC's, the speed
of which can be controlled by the serial connection. Adjust the speed to test
the draw of all 6 running at once.

-------------------------------
The MIT License (MIT)

Original Code Copyright (c) 2015 Blue Robotics Inc. Modifications
copyright (c) 2017 Chris Thierauf.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-------------------------------*/

//#define TWI_FREQ 100000l // Can be changed to reduce I2C frequency

#include <Wire.h>
#include "Arduino_I2C_ESC.h"

#define ESC_1 0x29
#define ESC_2 0x2A
#define ESC_3 0x2B
#define ESC_4 0x2C
#define ESC_5 0x2E
#define ESC_6 0x2F

Arduino_I2C_ESC motor1(ESC_1);
Arduino_I2C_ESC motor2(ESC_2);
Arduino_I2C_ESC motor3(ESC_3);
Arduino_I2C_ESC motor4(ESC_4);
Arduino_I2C_ESC motor5(ESC_5);
Arduino_I2C_ESC motor6(ESC_6);

int signal;

void setup() {
  Serial.begin(57600);
  Serial.println("Starting");

  Wire.begin();
}

void loop() {

	if ( Serial.available() > 0 ) {
  		signal = Serial.parseInt();
	}

	motor1.set(signal);
  		motor1.update();

	motor2.set(signal);
  		motor2.update();

	motor3.set(signal);
  		motor3.update();

	motor4.set(signal);
    	motor4.update();

	motor5.set(signal);
    	motor5.update();

	motor6.set(signal);
		motor6.update();


  Serial.print("ESC: ");
  if(motor1.isAlive()) Serial.print("OK\t\t");
  else Serial.print("NA\t\t");

  Serial.println("Stats from motor 1: ");
  Serial.print(signal);Serial.print(" \t\t");
  Serial.print(motor1.rpm());Serial.print(" RPM\t\t");
  Serial.print(motor1.voltage());Serial.print(" V\t\t");
  Serial.print(motor1.current());Serial.print(" A\t\t");
  Serial.print(motor1.temperature());Serial.print(" `C");
  Serial.println();

  delay(250); // Update at roughly 4 hz for the demo

}
