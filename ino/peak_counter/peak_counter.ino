#include <Servo.h>

#define SERVOPIN 3

int input=12;
int high_time;
int low_time;
float time_period;
float frequency;
float temp_freq;
int sample = 5;

//logic variables
boolean tone1=0;
boolean tone2=0;
int tol=50;
int freq1 = 260;
int freq2 = 1316;
byte buff=0x0;            //create buffer to debounce signal

Servo servo;              //create servo object
int toggle = -1;
int pos = 90;

void setup()
{
  Serial.begin(9600);
  pinMode(input,INPUT);
  servo.attach(SERVOPIN);

}
void loop(){

  while(!(tone1&&tone2)){
    delay(sample);                                             //sample every 200ms
    get_frequency();
    if(frequency>freq1-tol && frequency<freq1+tol){
      buff = (buff<<1)|0x1;                                 //fill next element in buffer
      if(buff == 0xF){                                      //if tone 1 is heard for 800ms, set tone1 to true
        tone1=1;
      }
    }
    else{buff = 0;}                                         //reset buffer if desired tone is not as long as expected
    
    while(tone1 && !tone2){
      delay(sample);                                           //sample every 200ms
      get_frequency();
      if(frequency>freq2-tol && frequency<freq2+tol){
        buff = (buff<<1)|0x1;                               //fill next element in buffer
        if(buff == 0xFF){                                   //if tone 2 is heard for 800ms, set tone2 to true
          tone2=1;
        }
      }
      else{buff = 0xF;}                                     //reset buffer if desired tone is not as long as expected
    }
  }
  tone1 = tone2 = 0;
  buff = 0x0;
  Serial.println("wowza");
  claw();
}

//function to control servo
void claw(){
 pos *= toggle; 
 Serial.println(pos);
 servo.write(pos);
}

void get_frequency(){
  high_time=pulseIn(input,HIGH);
  low_time=pulseIn(input,LOW);
  
  time_period=high_time+low_time;
  time_period=time_period/1000;
  temp_freq=1000/time_period;
  //if (temp_req 
  frequency=1000/time_period;
  Serial.println(frequency);
}

