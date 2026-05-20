import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OrdersStackParamList } from '../navigation/AppNavigator';
import { Order, OrderStatus, useOrders } from '../hooks/useOrders';

type Props = NativeStackScreenProps<OrdersStackParamList, 'OrdersList'>;

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'En attente',
  PAID: 'Payée',
  CANCELLED: 'Annulée',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: '#ffaa00',
  PAID: '#00e5cc',
  CANCELLED: '#666',
};

const FILTERS: Array<{ label: string; value: OrderStatus | undefined }> = [
  { label: 'Toutes', value: undefined },
  { label: 'En attente', value: 'PENDING' },
  { label: 'Payées', value: 'PAID' },
  { label: 'Annulées', value: 'CANCELLED' },
];

export default function OrdersScreen({ navigation }: Props) {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>(undefined);
  const { data: orders, isLoading, error } = useOrders({ status: statusFilter });

  function formatTotal(amount: number) {
    return `${amount.toLocaleString('fr-FR')} F`;
  }

  function renderOrder({ item }: { item: Order }) {
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('OrderDetail', { id: item.id })}
      >
        <View style={styles.rowLeft}>
          <Text style={styles.orderId}>#{item.id.slice(-6).toUpperCase()}</Text>
          <Text style={styles.total}>{formatTotal(item.total)}</Text>
          <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] + '22', borderColor: STATUS_COLORS[item.status] }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] }]}>
            {STATUS_LABELS[item.status]}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.label}
            style={[styles.filterBtn, statusFilter === f.value && styles.filterBtnActive]}
            onPress={() => setStatusFilter(f.value)}
          >
            <Text style={[styles.filterText, statusFilter === f.value && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && <ActivityIndicator color="#00e5cc" style={styles.loader} />}
      {!!error && <Text style={styles.error}>Erreur de chargement</Text>}

      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !isLoading ? <Text style={styles.empty}>Aucune commande</Text> : null
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateOrder', {})}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  filterRow: { flexDirection: 'row', padding: 12, gap: 8 },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a4a',
    backgroundColor: '#16213e',
  },
  filterBtnActive: { borderColor: '#00e5cc', backgroundColor: '#0a2a2a' },
  filterText: { color: '#aaa', fontSize: 12 },
  filterTextActive: { color: '#00e5cc', fontWeight: '600' },
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
  orderId: { color: '#aaa', fontSize: 12, fontWeight: '600', marginBottom: 2 },
  total: { color: '#fff', fontSize: 17, fontWeight: '700' },
  date: { color: '#666', fontSize: 12, marginTop: 2 },
  badge: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
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
