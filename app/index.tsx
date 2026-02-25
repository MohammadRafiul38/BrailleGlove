import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  PermissionsAndroid,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme
} from 'react-native';
import base64 from 'react-native-base64';
import { BleManager, Device } from 'react-native-ble-plx';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

let bleManager: BleManager | null = null;
try {
  if (Platform.OS !== 'web') {
    bleManager = new BleManager();
  }
} catch (e) {
  console.warn("BleManager initialization failed. If you are using Expo Go, BLE is not supported.");
}

const SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
const CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';

export default function HomeScreen() {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<'light' | 'dark'>(systemColorScheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    if (systemColorScheme) {
      setTheme(systemColorScheme === 'dark' ? 'dark' : 'light');
    }
  }, [systemColorScheme]);

  const isDark = theme === 'dark';

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const [scannedDevices, setScannedDevices] = useState<Device[]>([]);
  const [device, setDevice] = useState<Device | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    requestBluetoothPermissions();
    return () => {
      if (bleManager) {
        bleManager.stopDeviceScan();
      }
    };
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

  const startScan = () => {
    if (!bleManager) {
      setConnectionStatus('BLE not supported (Requires Dev Client)');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScannedDevices([]);
    setIsScanning(true);
    setConnectionStatus('Searching for Glove...');

    bleManager.startDeviceScan(null, null, (error, scannedDevice) => {
      if (error) {
        console.log("Scan Error:", error);
        setConnectionStatus('Scan Error - Check Bluetooth');
        setIsScanning(false);
        return;
      }

      if (scannedDevice && scannedDevice.name) {
        setScannedDevices((prev) => {
          if (prev.find((d) => d.id === scannedDevice.id)) return prev;
          return [...prev, scannedDevice];
        });
      }
    });

    // Stop scan after 10 seconds automatically
    setTimeout(() => {
      if (bleManager) {
        bleManager.stopDeviceScan();
        setIsScanning(false);
        if (scannedDevices.length === 0) setConnectionStatus('No devices found');
      }
    }, 10000);
  };

  const connectToDevice = async (selectedDevice: Device) => {
    if (!bleManager) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    bleManager.stopDeviceScan();
    setIsScanning(false);
    setConnectionStatus(`Connecting to ${selectedDevice.name}...`);

    try {
      const connectedDevice = await selectedDevice.connect();
      await connectedDevice.discoverAllServicesAndCharacteristics();
      setDevice(connectedDevice);
      setConnectionStatus('Connected! 🧤');
    } catch (e) {
      console.log("Connection Failed:", e);
      setConnectionStatus('Connection Failed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const disconnectDevice = async () => {
    if (device) {
      await device.cancelConnection();
      setDevice(null);
      setConnectionStatus('Disconnected');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const sendTextToGlove = async () => {
    if (!device) return;

    const textToVibrate = inputText.toLowerCase().replace(/[^a-z]/g, '');
    if (textToVibrate.length === 0) return;

    setIsSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    for (let i = 0; i < textToVibrate.length; i++) {
      const char = textToVibrate[i];
      const base64Data = base64.encode(char);
      
      try {
        await device.writeCharacteristicWithResponseForService(
          SERVICE_UUID,
          CHARACTERISTIC_UUID,
          base64Data
        );
      } catch (err) {
        console.log("Failed to send", err);
        setConnectionStatus('Link Lost');
        setDevice(null);
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    setIsSending(false);
    setInputText('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const renderDeviceItem = ({ item }: { item: Device }) => (
    <Animated.View entering={FadeInDown} layout={Layout.springify()}>
      <TouchableOpacity 
        style={[styles.deviceCard, isDark && darkStyles.deviceCard]} 
        onPress={() => connectToDevice(item)}
      >
        <View style={styles.deviceInfo}>
          <Ionicons name="bluetooth" size={24} color={isDark ? "#66B2FF" : "#007BFF"} />
          <View style={{ marginLeft: 12 }}>
            <Text style={[styles.deviceName, isDark && darkStyles.deviceName]}>{item.name || 'Unknown Device'}</Text>
            <Text style={[styles.deviceId, isDark && darkStyles.deviceId]}>{item.id}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={isDark ? "#555" : "#ccc"} />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, isDark && darkStyles.container]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Animated.Text entering={FadeInDown.delay(100)} style={[styles.title, isDark && darkStyles.title]}>
            BrailleGlove
          </Animated.Text>
          <TouchableOpacity onPress={toggleTheme}>
            <Ionicons name={isDark ? "sunny" : "moon"} size={26} color={isDark ? "#FFD700" : "#1A1A1A"} />
          </TouchableOpacity>
        </View>
        <Animated.View entering={FadeIn.delay(300)} style={[
          styles.statusBadge, 
          { backgroundColor: device 
              ? (isDark ? '#1B5E20' : '#E8F5E9') 
              : (isDark ? '#333333' : '#F5F5F5') 
          }
        ]}>
          <View style={[
            styles.statusDot, 
            { backgroundColor: device 
                ? '#4CAF50'
                : (isDark ? '#757575' : '#9E9E9E') 
            }
          ]} />
          <Text style={[
            styles.statusText, 
            { color: device 
                ? (isDark ? '#C8E6C9' : '#2E7D32') 
                : (isDark ? '#AAAAAA' : '#616161') 
            }
          ]}>
            {connectionStatus}
          </Text>
        </Animated.View>
      </View>

      {!device ? (
        <View style={styles.content}>
          <View style={styles.scanSection}>
            <TouchableOpacity 
              style={[styles.scanButton, isScanning && styles.scanButtonDisabled]} 
              onPress={startScan}
              disabled={isScanning}
            >
              {isScanning ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="search" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.buttonText}>Scan for Glove</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <FlatList
            data={scannedDevices}
            renderItem={renderDeviceItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => (
              !isScanning && (
                <View style={styles.emptyState}>
                  <Ionicons name="bluetooth-outline" size={64} color={isDark ? "#555555" : "#E0E0E0"} />
                  <Text style={[styles.emptyText, isDark && darkStyles.emptyText]}>Tap scan to find your device</Text>
                </View>
              )
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      ) : (
        <Animated.View entering={FadeIn} style={styles.controlPanel}>
          <View style={[styles.card, isDark && darkStyles.card]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, isDark && darkStyles.cardTitle]}>Communication</Text>
              <TouchableOpacity onPress={disconnectDevice}>
                <Text style={styles.disconnectText}>Disconnect</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, isDark && darkStyles.input]}
              placeholder="Enter text to convert..."
              value={inputText}
              onChangeText={setInputText}
              maxLength={20}
              placeholderTextColor={isDark ? "#888888" : "#BDBDBD"}
              editable={!isSending}
            />

            <TouchableOpacity 
              style={[
                styles.sendButton, 
                (!inputText || isSending) ? (isDark ? darkStyles.disabledButton : styles.disabledButton) : null
              ]} 
              onPress={sendTextToGlove}
              disabled={!inputText || isSending}
            >
              {isSending ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.buttonText}>Send to Glove</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={[styles.hint, isDark && darkStyles.hint]}>
              The glove will vibrate each letter in Braille pattern.
            </Text>
          </View>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: { 
    fontSize: 34, 
    fontWeight: '800', 
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scanSection: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  scanButton: { 
    backgroundColor: '#007BFF', 
    height: 56,
    borderRadius: 16, 
    flexDirection: 'row',
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  scanButtonDisabled: {
    backgroundColor: '#A0CAFF',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F3F5',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  deviceId: {
    fontSize: 12,
    color: '#ADB5BD',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: '#ADB5BD',
    marginTop: 16,
    fontSize: 16,
  },
  controlPanel: {
    paddingHorizontal: 24,
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F1F3F5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
  },
  disconnectText: {
    color: '#FF5252',
    fontWeight: '600',
  },
  input: { 
    height: 60, 
    backgroundColor: '#F8F9FA',
    borderRadius: 16, 
    paddingHorizontal: 20, 
    fontSize: 16,
    color: '#212529',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F3F5',
  },
  sendButton: { 
    backgroundColor: '#28A745', 
    height: 56,
    borderRadius: 16, 
    flexDirection: 'row',
    justifyContent: 'center', 
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#A5D6A7',
  },
  buttonText: { 
    color: 'white', 
    fontWeight: '700', 
    fontSize: 16 
  },
  hint: {
    textAlign: 'center',
    marginTop: 16,
    color: '#ADB5BD',
    fontSize: 13,
    lineHeight: 18,
  }
});

const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
  },
  title: {
    color: '#FFFFFF',
  },
  deviceCard: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  deviceName: {
    color: '#E5E5EA',
  },
  deviceId: {
    color: '#8E8E93',
  },
  emptyText: {
    color: '#8E8E93',
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  cardTitle: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#2C2C2E',
    color: '#FFFFFF',
    borderColor: '#3A3A3C',
  },
  disabledButton: {
    backgroundColor: '#2E7D32',
    opacity: 0.6,
  },
  hint: {
    color: '#8E8E93',
  }
});

