# BrailleGlove App Context

This project is an Expo app designed to connect with an Arduino-based Braille glove via Bluetooth. It takes text input from the user and sends it to the glove.

## Core Features
1. **Bluetooth LE Connectivity:** The app connects to the glove (which uses modules like HM-10) using the `react-native-ble-plx` library.
2. **Text Processing:** Users type text into the app, which filters the input to lowercase English letters (a-z).
3. **Data Transmission:** The app converts each character into Base64 format and sends it sequentially (with a small delay) to the glove's Bluetooth characteristic (`0000ffe1-0000-1000-8000-00805f9b34fb`).

## Setup and Architecture
- The default Expo Router tabs structure was stripped to keep it as simple as possible.
- The app uses a single main screen (`app/index.tsx`) containing the connection controls and text input interface.
- Bluetooth requires location and nearby devices permissions on Android. The appropriate configuration plugins are present in `app.json`.
- The `eas.json` is configured to build simple APKs using the `preview` profile for easy sideloading and testing without needing the Play Store.

## Future Agents
When modifying or debugging, ensure any Bluetooth-related permissions issues are solved before altering core characteristic/service UUIDs, as those are tied to the specific hardware on the glove. Avoid adding unnecessary UI frameworks unless explicitly required, to keep the footprint lightweight.
