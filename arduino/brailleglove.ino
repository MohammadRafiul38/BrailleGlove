#include <SoftwareSerial.h>

// RX on Pin 2 (Connect to HM-10 TX), TX on Pin 3 (Connect to HM-10 RX)
SoftwareSerial BLE(2, 3); 

// The pins connected to the 6 vibration motors
int motorPins = {4, 5, 6, 7, 8, 9};

// Braille dictionary for a-z. 
// 1 means Vibrate (HIGH), 0 means Off (LOW)
const byte brailleMap = {
  {1,0,0,0,0,0}, // a
  {1,1,0,0,0,0}, // b
  {1,0,0,1,0,0}, // c
  {1,0,0,1,1,0}, // d
  {1,0,0,0,1,0}, // e
  {1,1,0,1,0,0}, // f
  {1,1,0,1,1,0}, // g
  {1,1,0,0,1,0}, // h
  {0,1,0,1,0,0}, // i
  {0,1,0,1,1,0}, // j
  {1,0,1,0,0,0}, // k
  {1,1,1,0,0,0}, // l
  {1,0,1,1,0,0}, // m
  {1,0,1,1,1,0}, // n
  {1,0,1,0,1,0}, // o
  {1,1,1,1,0,0}, // p
  {1,1,1,1,1,0}, // q
  {1,1,1,0,1,0}, // r
  {0,1,1,1,0,0}, // s
  {0,1,1,1,1,0}, // t
  {1,0,1,0,0,1}, // u
  {1,1,1,0,0,1}, // v
  {0,1,0,1,1,1}, // w
  {1,0,1,1,0,1}, // x
  {1,0,1,1,1,1}, // y
  {1,0,1,0,1,1}  // z
};

void setup() {
  Serial.begin(9600);
  BLE.begin(9600); // Default HM-10 baud rate
  
  for(int i = 0; i < 6; i++){
    pinMode(motorPins, OUTPUT);
    digitalWrite(motorPins, LOW);
  }
  Serial.println("Glove is ready. Waiting for Bluetooth...");
}

void loop() {
  if (BLE.available()) {
    char receivedChar = BLE.read();
    receivedChar = tolower(receivedChar); // Convert to lowercase
    
    // Check if it's a letter between a and z
    if (receivedChar >= 'a' && receivedChar <= 'z') {
      int letterIndex = receivedChar - 'a'; // Find index (0 for 'a', 25 for 'z')
      
      Serial.print("Received: ");
      Serial.println(receivedChar);

      // Turn on the correct motors based on the Braille map
      for (int i = 0; i < 6; i++) {
        if (brailleMap == 1) {
          digitalWrite(motorPins, HIGH);
        } else {
          digitalWrite(motorPins, LOW);
        }
      }
      
      // Vibrate for 1 second so the user can feel it
      delay(1000); 
      
      // Turn all motors off
      for (int i = 0; i < 6; i++) {
        digitalWrite(motorPins, LOW);
      }
    }
  }
}