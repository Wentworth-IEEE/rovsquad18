int sig1[]={500,1000};
int sig2[]={250,1500};

void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);
  pinMode(9, OUTPUT);

}

void loop() {
  // put your main code here, to run repeatedly:
  for(int i=0; i<2; i++){ 
    tone(9, sig1[i]);
    delay(500);
    noTone(9);
    delay(100);
  }
  delay(1000);

  for(int i=0; i<2; i++){  
    tone(9, sig2[i]);
    delay(500);
    noTone(9);
    delay(100);
  }
  delay(1000);
}
