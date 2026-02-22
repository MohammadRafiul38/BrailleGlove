\### Step 1: Delete the Bloat (The Cleanup)

Open your VS Code Explorer and \*\*DELETE\*\* the following folders and files. Don't worry, it won't break anything once we update the main files!



1\. Delete the entire \*\*`components`\*\* folder.

2\. Delete the entire \*\*`constants`\*\* folder.

3\. Delete the entire \*\*`hooks`\*\* folder.

4\. Inside the \*\*`app`\*\* folder, delete the \*\*`(tabs)`\*\* folder.

5\. Inside the \*\*`app`\*\* folder, delete \*\*`modal.tsx`\*\* and \*\*`+not-found.tsx`\*\* (if you see it).



---



\### Step 2: The Final Clean Folder Structure

After deleting those, your project should look nice and simple, exactly like this:



```text

📁 SeeSky (or BrailleGlove)

&nbsp;┣ 📁 app

&nbsp;┃  ┣ 📄 \_layout.tsx      <-- We will rewrite this

&nbsp;┃  ┗ 📄 index.tsx        <-- We will create this (Your Main App)

&nbsp;┣ 📁 assets              <-- Keep this (has your app icons)

&nbsp;┣ 📁 scripts             <-- Keep this (internal Expo stuff)

&nbsp;┣ 📄 app.json            <-- We will update this

&nbsp;┣ 📄 eas.json            <-- We will update this

&nbsp;┣ 📄 package.json        <-- Keep this

&nbsp;┗ 📄 ... (other root files like tsconfig.json, keep them)

```



---



\### Step 3: The 4 Files You Need to Change



\#### 1. `app/\_layout.tsx` (The App Wrapper)

Since we deleted the tabs, we need to tell Expo to just render a simple blank screen.

\*\*Replace everything\*\* in `app/\_layout.tsx` with this:



```tsx

import { Stack } from 'expo-router';



export default function RootLayout() {

&nbsp; return (

&nbsp;   <Stack screenOptions={{ headerShown: false }}>

&nbsp;     <Stack.Screen name="index" />

&nbsp;   </Stack>

&nbsp; );

}

```



\#### 2. `app/index.tsx` (Your Main App UI \& Bluetooth Logic)

Create a new file inside the `app` folder called `index.tsx`. Paste the exact same Bluetooth code from my previous message. This is the heart of your project.



```tsx

import React, { useState, useEffect } from 'react';

import { View, Text, TextInput, TouchableOpacity, StyleSheet, PermissionsAndroid, Platform } from 'react-native';

import { BleManager, Device } from 'react-native-ble-plx';

import base64 from 'react-native-base64';



const bleManager = new BleManager();

const SERVICE\_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';

const CHARACTERISTIC\_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';



export default function HomeScreen() {

&nbsp; const \[device, setDevice] = useState<Device | null>(null);

&nbsp; const \[connectionStatus, setConnectionStatus] = useState<string>('Disconnected');

&nbsp; const \[inputText, setInputText] = useState<string>('');



&nbsp; useEffect(() => {

&nbsp;   requestBluetoothPermissions();

&nbsp; }, \[]);



&nbsp; const requestBluetoothPermissions = async () => {

&nbsp;   if (Platform.OS === 'android') {

&nbsp;     if (Platform.Version >= 31) {

&nbsp;       await PermissionsAndroid.requestMultiple(\[

&nbsp;         PermissionsAndroid.PERMISSIONS.BLUETOOTH\_SCAN,

&nbsp;         PermissionsAndroid.PERMISSIONS.BLUETOOTH\_CONNECT,

&nbsp;         PermissionsAndroid.PERMISSIONS.ACCESS\_FINE\_LOCATION,

&nbsp;       ]);

&nbsp;     } else {

&nbsp;       await PermissionsAndroid.request(

&nbsp;         PermissionsAndroid.PERMISSIONS.ACCESS\_FINE\_LOCATION

&nbsp;       );

&nbsp;     }

&nbsp;   }

&nbsp; };



&nbsp; const scanAndConnect = () => {

&nbsp;   setConnectionStatus('Scanning...');

&nbsp;   bleManager.startDeviceScan(null, null, async (error, scannedDevice) => {

&nbsp;     if (error) {

&nbsp;       console.log("Scan Error:", error);

&nbsp;       setConnectionStatus('Scan Error - Check Permissions');

&nbsp;       return;

&nbsp;     }

&nbsp;     

&nbsp;     if (scannedDevice \&\& scannedDevice.name \&\& (scannedDevice.name.includes('HM') || scannedDevice.name.includes('BT'))) {

&nbsp;       bleManager.stopDeviceScan();

&nbsp;       setConnectionStatus('Connecting...');

&nbsp;       

&nbsp;       try {

&nbsp;         const connectedDevice = await scannedDevice.connect();

&nbsp;         await connectedDevice.discoverAllServicesAndCharacteristics();

&nbsp;         setDevice(connectedDevice);

&nbsp;         setConnectionStatus('Connected to Glove! 🧤');

&nbsp;       } catch (e) {

&nbsp;         console.log("Connection Failed:", e);

&nbsp;         setConnectionStatus('Connection Failed');

&nbsp;       }

&nbsp;     }

&nbsp;   });

&nbsp; };



&nbsp; const sendTextToGlove = async () => {

&nbsp;   if (!device) {

&nbsp;     alert('Please connect to the glove first!');

&nbsp;     return;

&nbsp;   }



&nbsp;   const textToVibrate = inputText.toLowerCase().replace(/\[^a-z]/g, ''); 



&nbsp;   for (let i = 0; i < textToVibrate.length; i++) {

&nbsp;     const char = textToVibrate\[i];

&nbsp;     const base64Data = base64.encode(char); 

&nbsp;     

&nbsp;     try {

&nbsp;       await device.writeCharacteristicWithResponseForService(

&nbsp;         SERVICE\_UUID,

&nbsp;         CHARACTERISTIC\_UUID,

&nbsp;         base64Data

&nbsp;       );

&nbsp;       console.log(`Sent: ${char}`);

&nbsp;     } catch (err) {

&nbsp;       console.log("Failed to send", err);

&nbsp;     }

&nbsp;     await new Promise(resolve => setTimeout(resolve, 1500));

&nbsp;   }

&nbsp;   setInputText(''); 

&nbsp; };



&nbsp; return (

&nbsp;   <View style={styles.container}>

&nbsp;     <Text style={styles.title}>Braille Smart Glove</Text>

&nbsp;     <Text style={styles.status}>Status: {connectionStatus}</Text>



&nbsp;     <TouchableOpacity style={styles.button} onPress={scanAndConnect}>

&nbsp;       <Text style={styles.buttonText}>Scan \& Connect</Text>

&nbsp;     </TouchableOpacity>



&nbsp;     <TextInput

&nbsp;       style={styles.input}

&nbsp;       placeholder="Type a word..."

&nbsp;       value={inputText}

&nbsp;       onChangeText={setInputText}

&nbsp;       maxLength={20}

&nbsp;       placeholderTextColor="#888"

&nbsp;     />



&nbsp;     <TouchableOpacity style={\[styles.button, styles.sendButton]} onPress={sendTextToGlove}>

&nbsp;       <Text style={styles.buttonText}>Send to Glove</Text>

&nbsp;     </TouchableOpacity>

&nbsp;   </View>

&nbsp; );

}



const styles = StyleSheet.create({

&nbsp; container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },

&nbsp; title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#333' },

&nbsp; status: { fontSize: 16, marginBottom: 30, color: '#555' },

&nbsp; button: { backgroundColor: '#007BFF', padding: 15, borderRadius: 10, width: 200, alignItems: 'center', marginBottom: 20 },

&nbsp; sendButton: { backgroundColor: '#28A745' },

&nbsp; buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

&nbsp; input: { height: 50, borderColor: '#ccc', borderWidth: 1, width: 250, borderRadius: 10, paddingHorizontal: 15, marginBottom: 20, backgroundColor: 'white', color: '#000' }

});

```



\#### 3. `app.json` (Adding Bluetooth Permissions)

You \*\*must\*\* tell the Android operating system that your app uses Bluetooth.

Open `app.json` and ensure it has the `plugins` array added. It should look something like this:



```json

{

&nbsp; "expo": {

&nbsp;   "name": "BrailleGlove",

&nbsp;   "slug": "braille-glove",

&nbsp;   "version": "1.0.0",

&nbsp;   "orientation": "portrait",

&nbsp;   "icon": "./assets/images/icon.png",

&nbsp;   "userInterfaceStyle": "light",

&nbsp;   "scheme": "myapp",

&nbsp;   "ios": {

&nbsp;     "supportsTablet": true

&nbsp;   },

&nbsp;   "android": {

&nbsp;     "adaptiveIcon": {

&nbsp;       "foregroundImage": "./assets/images/adaptive-icon.png",

&nbsp;       "backgroundColor": "#ffffff"

&nbsp;     },

&nbsp;     "package": "com.yourname.brailleglove"

&nbsp;   },

&nbsp;   "plugins": \[

&nbsp;     \[

&nbsp;       "react-native-ble-plx",

&nbsp;       {

&nbsp;         "isBackgroundEnabled": false,

&nbsp;         "modes": \["central"],

&nbsp;         "bluetoothAlwaysPermission": "Allow BrailleGlove to connect to your glove."

&nbsp;       }

&nbsp;     ],

&nbsp;     "expo-dev-client"

&nbsp;   ]

&nbsp; }

}

```



\#### 4. `eas.json` (Forcing the APK Cloud Build)

As discussed earlier, replace everything in `eas.json` with this so Expo Cloud builds an APK instead of an AAB:



```json

{

&nbsp; "cli": {

&nbsp;   "version": ">= 7.0.0"

&nbsp; },

&nbsp; "build": {

&nbsp;   "development": {

&nbsp;     "developmentClient": true,

&nbsp;     "distribution": "internal"

&nbsp;   },

&nbsp;   "preview": {

&nbsp;     "distribution": "internal",

&nbsp;     "android": {

&nbsp;       "buildType": "apk"

&nbsp;     }

&nbsp;   },

&nbsp;   "production": {}

&nbsp; },

&nbsp; "submit": {

&nbsp;   "production": {}

&nbsp; }

}

```



---



\### Step 4: Final Check \& Build

Before building, make sure you actually installed the necessary libraries in your terminal:

```bash

npx expo install react-native-ble-plx @config-plugins/react-native-ble-plx expo-dev-client react-native-base64

```



Then, trigger your cloud build:

```bash

eas build -p android --profile preview

```



Your project is now perfectly clean, contains zero useless template bloat, and is 100% focused on communicating with your Arduino via Bluetooth!

