/*
// This entire set of code is commented out because I wanted it for reference,
// but it confuses the compiler.

int i=0;// position in mypwm vector
int m; // takes values from vector
int mypwm[]={0,1,2,3,3,4,5,6,6,7,8,9,10,11,12,13,14,15,16,17,17,18,19,20,20,21,22,23,24,25,26,27,27,28,29,30,31,31,32,
	33,34,34,35,36,37,37,38,39,40,41,41,42,43,44,44,45,46,47,48,48,49,50,51,51,52,53,54,55,55,56,57,58,58,59,60,61,61,
	62,63,64,65,65,66,67,68,68,69,70,71,72,72,73,74,75,75,76,77,78,79,79,80,81,82,82,83,84,85,86,86,87,88,89,89,90,91,
	92,93,93,94,95,96,96,97,98,99,99,100,101,102,103,103,104,105,106,106,107,108,109,110,111,112,113,113,114,115,116,
	117,117,118,119,120,120,121,122,123,124,124,125,126,127,127,128,129,130,130,131,132,133,134,135,136,137,137,138,
	139,140,141,141,142,143,144,144,145,146,147,148,148,149,150,151,151,152,153,154,154,155,156,157,158,159,160,161,
	161,162,163,164,165,165,166,167,168,168,169,170,171,172,172,173,174,175,175,176,177,178,179,179,180,181,182,183,
	184,185,185,186,187,188,189,189,190,191,192,192,193,194,195,196,196,197,198,199,199,200,201,202,203,203,204,205,206,
	206,207,208,209,210,210,211,212,213,213,214,215,216,216,217,218,219,220,220,221,222,223,223,224,225,226,227,227,228,
	229,230,230,231,232,233,234,234,235,236,237,238,239,240,241,242,243,244,244,245,246,247,247,248,249};
	// mypwm vector contains duty cycle values
void setup() {

	Serial.begin(9600);

	pinMode(5, OUTPUT);

	cli();// stop interrupts

	TCCR0A=0;
	TCCR0B=0;
	TCNT0=0;
	TCCR0A=0b10100001;// |= (1 << WGM00);//phase correct pwm mode
	TCCR0B=0b00000001;// |= (1<< CS00);// //no prescaling

	TCCR1A=0;
	TCCR1B=0;
	TCNT1=0;
	OCR1A=510;// here we have sincronized both timers (0 and 1)
	//0b allow me to write bits in binary
	TCCR1B=0b00001001;// |=(1 << WGM12);
	//TCCR1B |= (1 << CS10);//0b00001010;// fara prescaler
	TIMSK1 |=(1 << OCIE1A);

	sei();
}

ISR(TIMER1_COMPA_vect){
	if(i>(312)){// is n-1 because the vector is zero indexed
		i=0; // we have only 313 elements in the array because in this way we have
		// exactly 100.00Hz oscilloscope
	}
	m=mypwm[i];// the variable m takes values from vector
	i=i+1; // increase the position in vector
	OCR0B=m;// pin 5 on pwm with duty cycle from vector
}
void loop() {

}*/
