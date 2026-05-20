import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useStock, StockItem } from '../hooks/useStock';

export default function StockScreen() {
  const { data: items, isLoading, isError } = useStock();
  const [search, setSearch] = useState('');

  const filtered = (items ?? []).filter(
    (item) =>
      item.productName.toLowerCase().includes(search.toLowerCase()) ||
      (item.productType ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (item.sku ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  function renderItem({ item }: { item: StockItem }) {
    const isLow = item.lowStock;
    return (
      <View style={[styles.card, isLow && styles.cardLow]}>
        <View style={styles.cardLeft}>
          <Text style={styles.productName}>{item.productName}</Text>
          {item.productType ? <Text style={styles.productType}>{item.productType}</Text> : null}
          {item.sku ? <Text style={styles.sku}>SKU: {item.sku}</Text> : null}
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.qty, isLow && styles.qtyLow]}>{item.qty}</Text>
          <Text style={styles.qtyLabel}>en stock</Text>
          {isLow && <Text style={styles.lowBadge}>⚠ Bas</Text>}
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#00e5cc" size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Impossible de charger le stock.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        placeholder="Rechercher un produit..."
        placeholderTextColor="#555"
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {search ? 'Aucun résultat.' : 'Stock vide.'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  center: { flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#ef4444', fontSize: 15 },
  search: {
    margin: 12,
    backgroundColor: '#16213e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a4a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
  },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  cardLow: { borderColor: '#f59e0b' },
  cardLeft: { flex: 1 },
  productName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  productType: { color: '#aaa', fontSize: 12, marginTop: 2 },
  sku: { color: '#555', fontSize: 11, marginTop: 2, fontFamily: 'monospace' },
  cardRight: { alignItems: 'flex-end', minWidth: 60 },
  qty: { color: '#00e5cc', fontSize: 22, fontWeight: '800' },
  qtyLow: { color: '#f59e0b' },
  qtyLabel: { color: '#555', fontSize: 11 },
  lowBadge: { color: '#f59e0b', fontSize: 10, fontWeight: '700', marginTop: 4 },
  empty: { color: '#555', textAlign: 'center', marginTop: 40, fontSize: 14 },
});
