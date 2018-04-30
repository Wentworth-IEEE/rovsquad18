/**********
 1.5 - 50
 1.9 - 80
 2.29 - 100
 2.46 - 100
 */

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
boolean got_freq[] = {0,0,0};
int tol=100;
int freq1[] = {1900, 2460, 2290};
int freq2[] = {1500, 2290, 1900};
int buff=0x0;            //create buffer to debounce signal

Servo servo;              //create servo object
int toggle = -1;
int pos = 90;

void setup()
{
  //Serial.begin(9600);
  pinMode(input,INPUT);
  pinMode(13, OUTPUT);
  digitalWrite(13, LOW);
  servo.attach(SERVOPIN);

}
void loop(){
  get_frequency();
  /****************************************************
  BEGIN OPEN SEQUENCE
  ****************************************************/
  while(pos==90)
  {
    while(!(got_freq[0]&&got_freq[1]&&got_freq[2])){
      //Serial.println("------------------------------------LOOP 1-----------------------------------");
      delay(sample);                                             //sample every 200ms
      get_frequency();
      if(frequency>freq1[0]-tol && frequency<freq1[0]+tol){
        buff = (buff<<1)|0x1;                                 //fill next element in buffer
        if(buff == 0xF){                                      //if tone 1 is heard for 800ms, set tone1 to true
          got_freq[0]=1;
          //Serial.println("---------------------------------------------1 1---------------------------------------------------------");
          delay(100);
        }
      }
      else{buff = 0;}                                         //reset buffer if desired tone is not as long as expected
      
      while(got_freq[0] && !got_freq[1]){
        delay(sample);                                           //sample every 200ms
        get_frequency();
        if(frequency>freq1[1]-tol && frequency<freq1[1]+tol){
          buff = (buff<<1)|0x1;                               //fill next element in buffer
          if(buff == 0xFF){                                   //if tone 2 is heard for 800ms, set tone2 to true
            got_freq[1]=1;
            //Serial.println("-----------------------------1 2------------------------------------------");
            delay(100);
          }
        }
        else{buff = 0xF;}                                     //reset buffer if desired tone is not as long as expected
        
        while(got_freq[0] && got_freq[1] && !got_freq[2]){
        delay(sample);                                           //sample every 200ms
        get_frequency();
          if(frequency>freq1[2]-tol && frequency<freq1[2]+tol){
            buff = (buff<<1)|0x1;                               //fill next element in buffer
            if(buff == 0xFFF){                                   //if tone 2 is heard for 800ms, set tone2 to true
              got_freq[2]=1;
              claw();
              digitalWrite(13, HIGH);
              delay(100);
              digitalWrite(13, LOW);
              delay(100);
              digitalWrite(13, HIGH);
              delay(100);
              digitalWrite(13, LOW);
            }
          }
        else{buff = 0xFF;}                                     //reset buffer if desired tone is not as long as expected
        }
      }
    }
    reset();
  }
  /****************************************************
  END OPEN SEQUENCE
  ****************************************************/
  /****************************************************
  BEGIN CLOSE SEQUENCE
  ****************************************************/
  while(pos==-90)
  {
    //Serial.println("------------------------------------LOOP 2-----------------------------------");
    while(!(got_freq[0]&&got_freq[1]&&got_freq[2])){
      delay(sample);                                             //sample every 200ms
      get_frequency();
      if(frequency>freq2[0]-tol && frequency<freq2[0]+tol){
        buff = (buff<<1)|0x1;                                 //fill next element in buffer
        if(buff == 0xF){                                      //if tone 1 is heard for 800ms, set tone1 to true
          got_freq[0]=1;
          //Serial.println("------------------------------------2 1-----------------------------------");
        }
      }
      else{buff = 0;}                                         //reset buffer if desired tone is not as long as expected
      
      while(got_freq[0] && !got_freq[1]){
        delay(sample);                                           //sample every 200ms
        get_frequency();
        if(frequency>freq2[1]-tol && frequency<freq2[1]+tol){
          buff = (buff<<1)|0x1;                               //fill next element in buffer
          if(buff == 0xFF){                                   //if tone 2 is heard for 800ms, set tone2 to true
            got_freq[1]=1;
            //Serial.println("------------------------------------2 2-----------------------------------");
          }
        }
        else{buff = 0xF;}                                     //reset buffer if desired tone is not as long as expected
        
        while(got_freq[0] && got_freq[1] && !got_freq[2]){
        delay(sample);                                           //sample every 200ms
        get_frequency();
          if(frequency>freq2[2]-tol && frequency<freq2[2]+tol){
            buff = (buff<<1)|0x1;                               //fill next element in buffer
            if(buff == 0xFFF){                                   //if tone 2 is heard for 800ms, set tone2 to true
              got_freq[2]=1;
              //Serial.println("------------------------------------2 3-----------------------------------");
              claw();
              digitalWrite(13, HIGH);
              delay(100);
              digitalWrite(13, LOW);
              delay(100);
              digitalWrite(13, HIGH);
              delay(100);
              digitalWrite(13, LOW);
              delay(100);
              digitalWrite(13, HIGH);
              delay(100);
              digitalWrite(13, LOW);
              delay(100);
              digitalWrite(13, HIGH);
              delay(100);
              digitalWrite(13, LOW);
            }
          }
        else{buff = 0xFF;}                                     //reset buffer if desired tone is not as long as expected
        }
      }
    }
    reset();
  }
  /****************************************************
  END CLOSE SEQUENCE
  ****************************************************/
  //Serial.println("wowza");
  //delay(3000);
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

void reset()
{
  buff=0x0;
  for (int i=0; i < sizeof(got_freq); i++)
  {
    got_freq[i]=0;
  }
}



