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
  for(int i = 0; i < 6; i++) pinMode(motorPins[i], OUTPUT);
  Serial.println("System Live. Send 'a' from phone.");
}

void loop() {
  if (BLE.available()) {
    char c = tolower(BLE.read());
    if (c >= 'a' && c <= 'z') {
      int idx = c - 'a';
      Serial.print("Vibrating for: ");
      Serial.println(c);

      for (int i = 0; i < 6; i++) {
        if (brailleMap[idx][i] == 1) digitalWrite(motorPins[i], HIGH);
      }
      delay(500);
      for (int i = 0; i < 6; i++) digitalWrite(motorPins[i], LOW);
    }
  }
}
