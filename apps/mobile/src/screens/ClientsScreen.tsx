import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClientsStackParamList } from '../navigation/AppNavigator';
import { Client, useClients } from '../hooks/useClients';
import { OfflineBanner } from '../components/OfflineBanner';

type Props = NativeStackScreenProps<ClientsStackParamList, 'ClientsList'>;

export default function ClientsScreen({ navigation }: Props) {
  const [search, setSearch] = useState('');
  const { data: clients, isLoading, error } = useClients(search.trim() || undefined);

  function renderClient({ item }: { item: Client }) {
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('ClientDetail', { id: item.id })}
      >
        <View style={styles.rowLeft}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.sub}>
            {item.phone} · {item.city}
          </Text>
        </View>
        <Text style={styles.badge}>
          {item.type === 'ENTREPRISE' ? '🏢' : '👤'}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          placeholder="Rechercher par nom ou téléphone..."
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={() => navigation.navigate('QrScanner')}
        >
          <Text style={styles.scanIcon}>📷</Text>
        </TouchableOpacity>
      </View>

      {isLoading && <ActivityIndicator color="#00e5cc" style={styles.loader} />}
      {!!error && <Text style={styles.error}>Erreur de chargement</Text>}

      <FlatList
        data={clients}
        keyExtractor={(c) => c.id}
        renderItem={renderClient}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !isLoading ? <Text style={styles.empty}>Aucun client trouvé</Text> : null
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateClient')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: 12, gap: 8 },
  search: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  scanBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#16213e',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  scanIcon: { fontSize: 20 },
  loader: { marginTop: 24 },
  error: { color: '#ff6b6b', textAlign: 'center', marginTop: 16 },
  list: { paddingHorizontal: 12, paddingBottom: 80 },
  row: {
    backgroundColor: '#16213e',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  rowLeft: { flex: 1 },
  name: { color: '#fff', fontSize: 15, fontWeight: '600' },
  sub: { color: '#aaa', fontSize: 13, marginTop: 2 },
  badge: { fontSize: 20, marginLeft: 8 },
  empty: { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 14 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00e5cc',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#00e5cc',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: { color: '#000', fontSize: 28, lineHeight: 32 },
});
