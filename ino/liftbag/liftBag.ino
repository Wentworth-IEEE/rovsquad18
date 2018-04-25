/*********************************************************************
This program deals with the Lift Bag reciever on the WIT 2018 ROV

Note: Minimum time length of tone from transmitter shall be 600ms
**********************************************************************/
#include <Servo.h>

//definitions
#define SERVOPIN 3

//clipping indicator variables
boolean clipping = 0;

//data storage variables
byte newData = 0;  
byte prevData = 0;

//freq variables
unsigned int timer = 0;  //counts period of wave
unsigned int period;
int frequency;
int oldFreq;
int newFreq;

//logic variables
boolean tone1=0;
boolean tone2=0;
int tol=50;
int freq1 = 500;
int freq2 = 1000;
byte buff=0x0;            //create buffer to debounce signal

Servo servo;              //create servo object
int pos = 0;              //store servo positionattachInterrupt (1, functionname, condition);
  
void setup(){
    
  Serial.begin(9600);
  
  servo.attach(SERVOPIN);
  
  pinMode(13,OUTPUT);                                 //led indicator pin
  
  cli();                                              //disable interrupts
  
  //set up continuous sampling of analog pin 0 and clear ADCSRA and ADCSRB registers
  ADCSRA = 0;
  ADCSRB = 0;
  
  ADMUX |= (1 << REFS0);                              //set reference voltage
  ADMUX |= (1 << ADLAR);                              //left align the ADC value- so we can read highest 8 bits from ADCH register only
  ADCSRA |= (1 << ADPS2) | (1 << ADPS0);              //set ADC clock with 32 prescaler- 16mHz/32=500kHz
  ADCSRA |= (1 << ADATE);                             //enabble auto trigger
  ADCSRA |= (1 << ADIE);                              //enable interrupts when measurement complete
  ADCSRA |= (1 << ADEN);                              //enable ADC
  ADCSRA |= (1 << ADSC);                              //start ADC measurements
  
  sei();          //enable interrupts
}

ISR(ADC_vect) {                                       //when new ADC value ready
  prevData = newData;                                 //store  previous value
  newData = ADCH;                                     //get value from A0
  if (prevData < 127 && newData >=127){               //if increasing and crossing midpoint
    period = timer;                                   //get period
    timer = 0;                                        //reset timer
  }
  
  
  if (newData == 0 || newData == 1023){               //if clipping
    PORTB |= B00100000;                               //set pin 13 high- turn on clipping indicator led
    clipping = 1;                                     //currently clipping
  }
  
  timer++;                                            //increment timer at rate of 38.5kHz
}

void loop(){

  while(!(tone1&&tone2)){
    Serial.println("loop1");
    delay(10);                                              //sample every 200ms
    frequency = 38462/period;                               //timer rate/period
    Serial.println(frequency);
    //Serial.println(period);
    if(frequency>freq1-tol && frequency<freq1+tol){
      Serial.println("freq1");
      buff = (buff<<1)&0x1;                                 //fill next element in buffer
      if(buff == 0xF){                                      //if tone 1 is heard for 800ms, set tone1 to true
        Serial.println("freq1_heard");
        tone1=1;
        
      }
    }
    else{buff = 0;}                                         //reset buffer if desired tone is not as long as expected
    
    while(tone1 && !tone2){
      Serial.println("loop2");
      delay(10);                                            //sample every 200ms
      frequency = 38462/period;                             //timer rate/period
      if(frequency>freq2-tol && frequency<freq2+tol){
        Serial.println("freq2");
        buff = (buff<<1)&0x1;                               //fill next element in buffer
        if(buff == 0xFF){                                   //if tone 2 is heard for 800ms, set tone2 to true
          Serial.println("freq2_heard");
          tone2=1;
          claw();
        }
      }
      else{buff = 0xF;}                                     //reset buffer if desired tone is not as long as expected
    }
  }
  tone1 = tone2 = 0;
  buff = 0x0;
}

//function to control servo
void claw(){
  digitalWrite(13,HIGH);
  delay(1000);
  digitalWrite(13,LOW);
    
/*  delay(15);
  for (pos = 0; pos <= 90; pos++) {  // move from 0 to 90 degrees
    servo.write(pos);                 // write position to servo
    delay(15);                        // waits 15ms for the servo to reach the position
  }
  delay(1000);
  for (pos; pos >= 0; pos--) {   // move from pos to 0 degrees
    servo.write(pos);                 // write position to servo
    delay(15);                        // waits 15ms for the servo to reach the position
  }
  delay(15);
*/
}
