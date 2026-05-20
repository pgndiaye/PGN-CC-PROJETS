import React from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClientsStackParamList } from '../navigation/AppNavigator';
import { useClient, useClientQr } from '../hooks/useClients';

type Props = NativeStackScreenProps<ClientsStackParamList, 'ClientDetail'>;

export default function ClientDetailScreen({ route }: Props) {
  const { id } = route.params;
  const { data: client, isLoading, error } = useClient(id);
  const { data: qrData, isLoading: qrLoading } = useClientQr(id);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#00e5cc" size="large" />
      </View>
    );
  }

  if (error || !client) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Client introuvable</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.label}>Nom</Text>
        <Text style={styles.value}>{client.name}</Text>

        <Text style={styles.label}>Téléphone</Text>
        <Text style={styles.value}>{client.phone}</Text>

        <Text style={styles.label}>Ville</Text>
        <Text style={styles.value}>{client.city}</Text>

        {client.address && (
          <>
            <Text style={styles.label}>Adresse</Text>
            <Text style={styles.value}>{client.address}</Text>
          </>
        )}

        <Text style={styles.label}>Type</Text>
        <Text style={styles.value}>
          {client.type === 'ENTREPRISE' ? '🏢 Entreprise' : '👤 Particulier'}
        </Text>

        <Text style={styles.label}>Client depuis</Text>
        <Text style={styles.value}>
          {new Date(client.createdAt).toLocaleDateString('fr-SN')}
        </Text>
      </View>

      <View style={styles.qrCard}>
        <Text style={styles.qrTitle}>Code QR Client</Text>
        {qrLoading ? (
          <ActivityIndicator color="#00e5cc" style={styles.qrLoader} />
        ) : qrData ? (
          <Image
            source={{ uri: qrData.qrDataUrl }}
            style={styles.qrImage}
            resizeMode="contain"
          />
        ) : null}
        <Text style={styles.qrSub}>
          Scannez pour accéder au profil client
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a2e' },
  error: { color: '#ff6b6b', fontSize: 15 },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a4a',
    marginBottom: 16,
  },
  label: { color: '#888', fontSize: 12, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { color: '#fff', fontSize: 15, marginTop: 2 },
  qrCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a4a',
    alignItems: 'center',
  },
  qrTitle: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 12 },
  qrLoader: { marginVertical: 40 },
  qrImage: { width: 200, height: 200, backgroundColor: '#fff', borderRadius: 8 },
  qrSub: { color: '#666', fontSize: 12, marginTop: 10, textAlign: 'center' },
});
