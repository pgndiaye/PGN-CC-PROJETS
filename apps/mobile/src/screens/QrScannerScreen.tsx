import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BarCodeScanner, BarCodeScannerResult } from 'expo-barcode-scanner';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClientsStackParamList } from '../navigation/AppNavigator';

const CLIENT_URL_PREFIX = 'https://app.ezvizsenegal.sn/clients/';

type Props = NativeStackScreenProps<ClientsStackParamList, 'QrScanner'>;

export default function QrScannerScreen({ navigation }: Props) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    BarCodeScanner.requestPermissionsAsync().then(({ status }) => {
      setHasPermission(status === 'granted');
    });
  }, []);

  function handleBarCodeScanned({ data }: BarCodeScannerResult) {
    if (scanned) return;
    setScanned(true);

    if (!data.startsWith(CLIENT_URL_PREFIX)) {
      Alert.alert('QR invalide', 'Ce QR code ne correspond pas à un client EZVIZ Sénégal.', [
        { text: 'Réessayer', onPress: () => setScanned(false) },
        { text: 'Annuler', onPress: () => navigation.goBack() },
      ]);
      return;
    }

    const id = data.slice(CLIENT_URL_PREFIX.length);
    navigation.replace('ClientDetail', { id });
  }

  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Demande d'accès à la caméra...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Accès à la caméra refusé.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
        barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
      />
      <View style={styles.overlay}>
        <View style={styles.frame} />
        <Text style={styles.hint}>Pointez vers un QR code client</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { color: '#aaa', fontSize: 15, textAlign: 'center' },
  btn: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#00e5cc', borderRadius: 8 },
  btnText: { color: '#000', fontWeight: '700', fontSize: 14 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: '#00e5cc',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  hint: { color: '#fff', marginTop: 20, fontSize: 14, textShadowColor: '#000', textShadowRadius: 4 },
});
