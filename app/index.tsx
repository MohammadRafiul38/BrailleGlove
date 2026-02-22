import React, { useEffect, useState } from 'react';
import { PermissionsAndroid, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import base64 from 'react-native-base64';
import { BleManager, Device } from 'react-native-ble-plx';

const bleManager = new BleManager();
const SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
const CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';

export default function HomeScreen() {
  const [device, setDevice] = useState<Device | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');
  const [inputText, setInputText] = useState<string>('');

  useEffect(() => {
    requestBluetoothPermissions();
  }, []);

  const requestBluetoothPermissions = async () => {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
      } else {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
      }
    }
  };

  const scanAndConnect = () => {
    setConnectionStatus('Scanning...');
    bleManager.startDeviceScan(null, null, async (error, scannedDevice) => {
      if (error) {
        console.log("Scan Error:", error);
        setConnectionStatus('Scan Error - Check Permissions');
        return;
      }
      
      if (scannedDevice && scannedDevice.name && (scannedDevice.name.includes('HM') || scannedDevice.name.includes('BT'))) {
        bleManager.stopDeviceScan();
        setConnectionStatus('Connecting...');
        
        try {
          const connectedDevice = await scannedDevice.connect();
          await connectedDevice.discoverAllServicesAndCharacteristics();
          setDevice(connectedDevice);
          setConnectionStatus('Connected to Glove! 🧤');
        } catch (e) {
          console.log("Connection Failed:", e);
          setConnectionStatus('Connection Failed');
        }
      }
    });
  };

  const sendTextToGlove = async () => {
    if (!device) {
      alert('Please connect to the glove first!');
      return;
    }

    const textToVibrate = inputText.toLowerCase().replace(/[^a-z]/g, ''); 

    for (let i = 0; i < textToVibrate.length; i++) {
      const char = textToVibrate[i];
      const base64Data = base64.encode(char); 
      
      try {
        await device.writeCharacteristicWithResponseForService(
          SERVICE_UUID,
          CHARACTERISTIC_UUID,
          base64Data
        );
        console.log(`Sent: ${char}`);
      } catch (err) {
        console.log("Failed to send", err);
      }
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    setInputText(''); 
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Braille Smart Glove</Text>
      <Text style={styles.status}>Status: {connectionStatus}</Text>

      <TouchableOpacity style={styles.button} onPress={scanAndConnect}>
        <Text style={styles.buttonText}>Scan & Connect</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Type a word..."
        value={inputText}
        onChangeText={setInputText}
        maxLength={20}
        placeholderTextColor="#888"
      />

      <TouchableOpacity style={[styles.button, styles.sendButton]} onPress={sendTextToGlove}>
        <Text style={styles.buttonText}>Send to Glove</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  status: { fontSize: 16, marginBottom: 30, color: '#555' },
  button: { backgroundColor: '#007BFF', padding: 15, borderRadius: 10, width: 200, alignItems: 'center', marginBottom: 20 },
  sendButton: { backgroundColor: '#28A745' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  input: { height: 50, borderColor: '#ccc', borderWidth: 1, width: 250, borderRadius: 10, paddingHorizontal: 15, marginBottom: 20, backgroundColor: 'white', color: '#000' }
});
