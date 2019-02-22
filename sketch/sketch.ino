const byte frame[8][42] = {{0,0,0,32,32,0,127,28,0,30,8,3,0,127,3,7,3,3,0,0,127,1,2,2,1,0,128,127,224,16,0,0,65,0,127,0,0,0,32,48,0,127},{0,0,0,32,32,0,191,12,0,118,8,2,1,191,1,3,0,0,0,0,191,1,6,2,2,0,96,191,0,16,0,252,67,0,191,0,0,0,32,0,0,191},{0,0,0,64,224,0,223,8,0,12,12,2,1,223,0,0,3,0,0,0,223,1,4,6,2,0,16,223,0,17,192,7,102,0,223,0,0,0,0,0,0,223},{0,0,0,64,112,192,239,24,0,195,4,2,1,239,0,0,4,0,0,0,239,1,4,0,0,0,0,239,0,255,127,0,24,31,239,0,0,0,0,0,248,239},{0,0,0,128,0,96,247,224,0,112,19,2,1,247,0,0,4,3,0,0,247,0,0,0,1,1,0,247,224,0,0,0,0,49,247,0,0,0,0,240,128,247},{0,0,0,0,0,32,251,0,0,12,29,7,1,251,0,14,196,2,0,0,251,0,0,1,1,0,0,251,0,0,8,0,0,96,251,0,0,0,224,32,128,251},{0,0,0,0,16,32,253,0,192,2,3,13,0,253,0,7,52,4,0,0,253,0,0,1,3,1,0,253,0,0,24,0,0,64,253,0,0,0,48,32,128,253},{0,0,0,0,16,32,254,0,56,0,2,8,0,254,255,3,28,14,2,0,254,0,1,2,2,1,0,254,0,0,16,0,0,64,254,0,0,224,0,32,192,254}};
#define Xpix 48
#define Ypix 48
// keep this line here

#define clockPin A0 // clock   SH_CP   geel
#define latchPin A1 // latch   ST_CP   paars
#define dataPin A2  // data    DS      bruin

void setup()
{
  pinMode(latchPin, OUTPUT);
  pinMode(clockPin, OUTPUT);
  pinMode(dataPin, OUTPUT);
  digitalWrite(dataPin, 0);
  digitalWrite(clockPin, 0);
}

void loop()
{
  for (byte column = 0; column < 8; column++)
  {

    // digitalWrite(latchPin, HIGH);
    PORTC = B00000010;
    for (byte i = 0; i < 7 * (Ypix / 8); i++)
    {
      for (byte b = 0; b < 8; b++)
      {
        // digitalWrite(clockPin, LOW);
        PORTC = B00000010;
        byte x = bitRead(frame[column][i], 7 - b);
        if (x)
          // digitalWrite(dataPin, HIGH);
          PORTC = B00000110;
        else
          // digitalWrite(dataPin, LOW);
          PORTC = B00000010;

        // digitalWrite(clockPin, HIGH);
        PORTC = B10000011;
      }
    }
    PORTC = B00000000;
    // digitalWrite(latchPin, LOW);
  }
}
