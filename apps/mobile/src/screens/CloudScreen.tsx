import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CloudStackParamList } from '../navigation/AppNavigator';
import { CloudSubscription, useSubscriptions } from '../hooks/useCloud';
import { OfflineBanner } from '../components/OfflineBanner';

type Props = NativeStackScreenProps<CloudStackParamList, 'CloudList'>;

function daysUntilExpiry(expiresAt: string): number {
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
}

function StatusBadge({ isActive, expiresAt }: { isActive: boolean; expiresAt: string }) {
  if (!isActive) {
    return <Text style={[styles.badge, styles.badgeExpired]}>Expiré</Text>;
  }
  const days = daysUntilExpiry(expiresAt);
  const style = days <= 30 ? styles.badgeWarning : styles.badgeActive;
  return (
    <Text style={[styles.badge, style]}>
      {days <= 30 ? `J-${days}` : 'Actif'}
    </Text>
  );
}

export default function CloudScreen({ navigation }: Props) {
  const { data: subs, isLoading, error } = useSubscriptions();

  function renderSub({ item }: { item: CloudSubscription }) {
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('CloudDetail', { id: item.id })}
      >
        <View style={styles.rowLeft}>
          <Text style={styles.name}>{item.client.name}</Text>
          <Text style={styles.serial}>SN: {item.serialNumber}</Text>
          <Text style={styles.expiry}>
            Expire: {new Date(item.expiresAt).toLocaleDateString('fr-SN')}
          </Text>
        </View>
        <StatusBadge isActive={item.isActive} expiresAt={item.expiresAt} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <OfflineBanner />
      {isLoading && <ActivityIndicator color="#00e5cc" style={styles.loader} />}
      {!!error && <Text style={styles.error}>Erreur de chargement</Text>}

      <FlatList
        data={subs}
        keyExtractor={(s) => s.id}
        renderItem={renderSub}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !isLoading ? <Text style={styles.empty}>Aucun abonnement cloud</Text> : null
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateSubscription', {})}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  loader: { marginTop: 24 },
  error: { color: '#ff6b6b', textAlign: 'center', marginTop: 16 },
  list: { padding: 12, paddingBottom: 80 },
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
  serial: { color: '#aaa', fontSize: 12, marginTop: 2 },
  expiry: { color: '#888', fontSize: 12, marginTop: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 12, fontWeight: '700', overflow: 'hidden' },
  badgeActive: { backgroundColor: '#0a3a1a', color: '#00e5cc' },
  badgeWarning: { backgroundColor: '#3a2a00', color: '#ffaa00' },
  badgeExpired: { backgroundColor: '#3a0a0a', color: '#ff6b6b' },
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
