//LIFT BAG SPEAKER CODE
int tone_open_a[]={1900,2460,2290};
int tone_close_a[]={1500,2290,1900};
int tone_open_b[]={2460,1500,2290};
int tone_close_b[]={2290,1500,2460};
const int tone_pin=3; //output pin
const int open_a_pin=4; //signals from GPIO on PI
const int close_a_pin=5;
const int open_b_pin=6;
const int close_b_pin=8;
unsigned int del=1000;
unsigned int n=3; //array length
bool open_a=0;
bool close_a=0;
bool open_b=0;
bool close_b=0;
unsigned int open_a_old=0;
unsigned int close_a_old=0;
unsigned int open_b_old=0;
unsigned int close_b_old=0;
void setup() {
  pinMode(open_a_pin, INPUT);
  pinMode(close_a_pin, INPUT);
  pinMode(open_b_pin, INPUT);
  pinMode(close_b_pin, INPUT); 
}
void loop() {
  
  open_a=digitalRead(open_a_pin);
  close_a=digitalRead(close_a_pin);
  open_b=digitalRead(open_b_pin);
  close_b=digitalRead(close_b_pin);
  
  if(open_a==1 && open_a_old==0){
    for(int i=0; i<n; i++){
      noTone(tone_pin);
      tone(tone_pin, tone_open_a[i]);
      delay(del);
      noTone(tone_pin);
      delay(del*2);
    }
  }
  else if(close_a==1 && close_a_old==0){
    for(int i=0; i<n; i++){
      noTone(tone_pin);
      tone(tone_pin, tone_close_a[i]);
      delay(del);
      noTone(tone_pin);
      delay(del*2);
    }
  }
  else if(open_b==1 && open_b_old==0){
    for(int i=0; i<4; i++){
      noTone(tone_pin);
      tone(tone_pin, tone_open_b[i]);
      delay(del);
      noTone(tone_pin);
      delay(del);
    }
  }
  else if(close_b==1 && close_b_old==0){
    for(int i=0; i<4; i++){
      noTone(tone_pin);
      tone(tone_pin, tone_close_b[i]);
      delay(del);
      noTone(tone_pin);
      delay(del);
    }
  }
  open_a_old=open_a;
  close_a_old=close_a;
  open_b_old=open_b;
  close_b_old=close_b;
}
