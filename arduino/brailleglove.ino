#include <SoftwareSerial.h>

SoftwareSerial BLE(2, 3); 

int motorPins[6] = {4, 5, 6, 7, 8, 9};

const byte brailleMap[26][6] = {
  {1,0,0,0,0,0}, {1,1,0,0,0,0}, {1,0,1,0,0,0}, {1,0,1,1,0,0}, 
  {1,0,0,1,0,0}, {1,1,1,0,0,0}, {1,1,1,1,0,0}, {1,1,0,1,0,0}, 
  {0,1,1,0,0,0}, {0,1,1,1,0,0}, {1,0,0,0,1,0}, {1,1,0,0,1,0}, 
  {1,0,1,0,1,0}, {1,0,1,1,1,0}, {1,0,0,1,1,0}, {1,1,1,0,1,0}, 
  {1,1,1,1,1,0}, {1,1,0,1,1,0}, {0,1,1,0,1,0}, {0,1,1,1,1,0}, 
  {1,0,0,0,1,1}, {1,1,0,0,1,1}, {0,1,1,1,0,1}, {1,0,1,0,1,1}, 
  {1,0,1,1,1,1}, {1,0,0,1,1,1}
};

void setup() {
  Serial.begin(9600); 
  BLE.begin(9600);    
  
  for(int i = 0; i < 6; i++){
    pinMode(motorPins[i], OUTPUT);
    digitalWrite(motorPins[i], LOW);
  }
  Serial.println("Glove Ready. Use Serial Monitor or App to test.");
}

void loop() {
  char c = 0;
  if (BLE.available()) { 
    c = BLE.read(); 
  } else if (Serial.available()) { 
    c = Serial.read(); 
  }

  if (c != 0) {
    c = tolower(c);
    if (c >= 'a' && c <= 'z') {
      int idx = c - 'a';
      Serial.print("Vibrating for: ");
      Serial.println(c);

      for (int p = 0; p < 3; p++) {
        for (int i = 0; i < 6; i++) {
          if (brailleMap[idx][i] == 1) digitalWrite(motorPins[i], HIGH);
        }
        delay(200);
        for (int i = 0; i < 6; i++) digitalWrite(motorPins[i], LOW);
        delay(150);
      }
    }
  }
}
