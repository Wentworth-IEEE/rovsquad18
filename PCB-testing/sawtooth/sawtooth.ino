#include <math.h>
#include <string.h>

void setup() {
  // Set up serial stuff for user interaction.
  Serial.begin(9600);
}

/*
 * Gives the user a warning if they've done something that appears unreasonable,
 * gives the option to do it anyway
 */
boolean warn(String warning){
	Serial.print(warning);
	Serial.print(" Continue? (y/n) ");
  char input;
  while( (input = Serial.read()) == -1);
  
  Serial.println();
  return input == 'y' || input == 'Y';
}

/*
 * Generates a sawtooth waveform using PWM (requires a capacitor).
 * Starts by requesting a wavelength, goes from there.
 */
void loop() {
	  // Declare stuff
	  int pin = 9; 				// This is the pin to generate a signal on.
	  boolean run_loop = true;	// If the sawtooth generation loop should keep running

	  // Request sawtooth wavelength (ms)

    Serial.println("Specify sawtooth frequency (Hz) as an integer: ");
    int hertz;
    while( (hertz = Serial.parseInt()) == 0); // Runs until a non-zero value is given to hertz
                                              // Note that Serial.parseInt() returns 0 on timeout
	  // Do basic sanity checking, starting by informing the user.
    // Apparently Serial.print doesn't like data types, so here we are.
	  Serial.print("Frequency set to "); Serial.print(hertz); Serial.print(" Hz");

    if(10000/hertz <= 3) { // Accuracy below 3 microseconds isn't guaranteed. 
  	    run_loop = warn("\nThis frequency may be too rapid for the arduino to accurately create.");
    } else if (hertz < 20) {
        run_loop = warn("\nThis frequency is at the lower range of hearing (20 Hz).");
    } else if (hertz > 20000) {
        run_loop = warn("\nThis frequency is at the upper range of hearing (20000 Hz)");
    } else {
  	    run_loop = true;
    }

	/*
	 * Generate sawtooth.
	 * Starts at 100% duty cycle, steps down the pulswidth until at 0.
	 * Time over which this occurs is determined by the sawtooth wavelength
	 * the user specified earlier.
	 */
  if(run_loop){
    Serial.println("\nRunning!");
  }
	while(run_loop) {
        for(int step = 10; step != 0; --step){
            analogWrite(pin, 25.5*step);           // Sets the pin to the percentage of PWM that is appropriate for the step
            delayMicroseconds(10000/hertz);        // (100000 microseconds in a second) / (10 steps) * t, t = 1/Hz
        }
	}
}

/*
int ledPin = 9;    // LED connected to digital pin 9

void setup() {
  // nothing happens in setup
}

void loop() {
  // fade in from min to max in increments of 5 points:
  for (int fadeValue = 0 ; fadeValue <= 255; fadeValue += 5) {
    // sets the value (range from 0 to 255):
    analogWrite(ledPin, fadeValue);
    // wait for 30 milliseconds to see the dimming effect
    delay(30);
  }

  // fade out from max to min in increments of 5 points:
  for (int fadeValue = 255 ; fadeValue >= 0; fadeValue -= 5) {
    // sets the value (range from 0 to 255):
    analogWrite(ledPin, fadeValue);
    // wait for 30 milliseconds to see the dimming effect
    delay(30);
  }
}
*/
