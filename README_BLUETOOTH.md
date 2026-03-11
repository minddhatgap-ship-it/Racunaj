# Bluetooth POS Printer Setup - Navodila

## 🔧 Zahteve

### Paket
- `react-native-bluetooth-escpos-printer` - avtomatsko nameščen preko OnSpace sistema

### Podprti tiskalniki
- 58mm termični POS tiskalniki z ESC/POS protokolom
- Primeri: Xprinter, Goojprt, Sunmi, Epson TM-series

## 📱 Permissions

### Android
Konfigurirano v `app.json` in `android/app/src/main/AndroidManifest.xml`:
- `BLUETOOTH` (Android <12)
- `BLUETOOTH_ADMIN` (Android <12)
- `BLUETOOTH_SCAN` (Android 12+)
- `BLUETOOTH_CONNECT` (Android 12+)
- `ACCESS_FINE_LOCATION` (potrebno za Bluetooth scan)

### iOS
Konfigurirano v `app.json` → `ios.infoPlist`:
- `NSBluetoothAlwaysUsageDescription`
- `NSBluetoothPeripheralUsageDescription`

## 🚀 Uporaba

### 1. Build aplikacije
```bash
# Za Android
npx expo run:android

# Za iOS
npx expo run:ios
```

### 2. V aplikaciji

1. **Nastavitve** → **Bluetooth tiskalnik**
2. Kliknite **"Poišči tiskalnike"**
3. Izberite tiskalnik iz seznama
4. Preverite s **"Testno tiskanje"**

### 3. Tiskanje računov

Po izdaji računa izberite:
- **Natisni račun** → tiskalnik natisne račun na 58mm papirju

## 🐛 Debugging

### Napaka: "Bluetooth paket ni na voljo"
**Rešitev:** Paket še ni nameščen. Izvedi:
```bash
npx expo prebuild --clean
npx expo run:android
```

### Napaka: "Bluetooth permissions niso odobrene"
**Rešitev:**
- Android: Pojdi v Nastavitve → Aplikacije → [App] → Dovoljenja → Omogoči Bluetooth in Lokacijo
- iOS: Nastavitve → [App] → Omogoči Bluetooth

### Napaka: "Naprava ni najdena"
**Rešitev:**
1. Preveri da je tiskalnik vklopljen
2. Preveri da je Bluetooth vklopljen na telefonu
3. Spari tiskalnik v Android/iOS Bluetooth nastavitvah
4. Poskusi ponovno iskanje v aplikaciji

### Console logi
Vse operacije se logirajo v console:
```
🔵 Initializing Bluetooth...
🔐 Checking permissions...
✅ Permissions OK
📡 Scanning for devices...
Device 1: { name: "POS-5890", address: "AA:BB:CC:DD:EE:FF" }
✅ Total devices found: 1
```

## 📋 Testiranje

### Testno tiskanje
Testno tiskanje preveri:
- ✅ Bluetooth povezavo
- ✅ ESC/POS komande
- ✅ Formatiranje (poravnava, velikost pisave)
- ✅ Rezanje papirja

### Mock način
V `settings.tsx` omogoči **Testni način** za simulacijo brez prave FURS API povezave.

## 🔗 Viri

- [react-native-bluetooth-escpos-printer GitHub](https://github.com/januslo/react-native-bluetooth-escpos-printer)
- [ESC/POS Command Reference](https://reference.epson-biz.com/modules/ref_escpos/index.php)
- [Expo Build Properties](https://docs.expo.dev/versions/latest/sdk/build-properties/)

## ⚠️ Pomembno

- **Android 12+** zahteva nove Bluetooth permissions
- **iOS** zahteva Info.plist vnose
- **Native rebuild** potreben po spremembi `app.json`
- **Tiskalnik mora biti sparjen** (paired) preko Android/iOS Bluetooth nastavitev
