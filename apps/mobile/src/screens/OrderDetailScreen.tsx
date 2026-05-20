import React from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OrdersStackParamList } from '../navigation/AppNavigator';
import { useOrder, useUpdateOrder, OrderStatus } from '../hooks/useOrders';

type Props = NativeStackScreenProps<OrdersStackParamList, 'OrderDetail'>;

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'En attente',
  PAID: 'Payée',
  CANCELLED: 'Annulée',
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: '#f59e0b',
  PAID: '#10b981',
  CANCELLED: '#ef4444',
};

export default function OrderDetailScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const { data: order, isLoading, isError } = useOrder(id);
  const { mutateAsync: updateOrder, isPending } = useUpdateOrder(id);

  async function handleCancel() {
    Alert.alert('Annuler la commande', 'Cette action est irréversible. Continuer ?', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui, annuler',
        style: 'destructive',
        onPress: async () => {
          try {
            await updateOrder({ status: 'CANCELLED' });
          } catch {
            Alert.alert('Erreur', 'Impossible d\'annuler la commande.');
          }
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#00e5cc" size="large" />
      </View>
    );
  }

  if (isError || !order) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Commande introuvable.</Text>
      </View>
    );
  }

  const canPay = order.status === 'PENDING';
  const canCancel = order.status === 'PENDING';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.orderId}>#{order.id.slice(-8).toUpperCase()}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLOR[order.status] + '22', borderColor: STATUS_COLOR[order.status] }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLOR[order.status] }]}>
            {STATUS_LABEL[order.status]}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Montant total</Text>
        <Text style={styles.total}>{order.total.toLocaleString('fr-FR')} F CFA</Text>
      </View>

      {order.client && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Client</Text>
          <Text style={styles.cardValue}>{order.client.name}</Text>
          {order.client.phone && <Text style={styles.cardSub}>{order.client.phone}</Text>}
        </View>
      )}

      {order.paymentMethod && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mode de paiement</Text>
          <Text style={styles.cardValue}>
            {order.paymentMethod === 'WAVE' ? '🌊 Wave' : order.paymentMethod === 'ORANGE_MONEY' ? '🟠 Orange Money' : order.paymentMethod}
          </Text>
        </View>
      )}

      {order.notes ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notes</Text>
          <Text style={styles.cardValue}>{order.notes}</Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Articles ({order.lines?.length ?? 0})</Text>
      {(order.lines ?? []).map((line) => (
        <View key={line.id} style={styles.lineRow}>
          <View style={styles.lineInfo}>
            <Text style={styles.lineName}>{line.productName}</Text>
            {line.productType ? <Text style={styles.lineSub}>{line.productType}</Text> : null}
          </View>
          <Text style={styles.lineQty}>×{line.qty}</Text>
          <Text style={styles.linePrice}>{line.subtotal.toLocaleString('fr-FR')} F</Text>
        </View>
      ))}

      {canPay && (
        <TouchableOpacity
          style={styles.payBtn}
          onPress={() => navigation.navigate('PaymentInit', { orderId: order.id, total: order.total })}
        >
          <Text style={styles.payBtnText}>💳 Encaisser en Mobile Money</Text>
        </TouchableOpacity>
      )}

      {canCancel && (
        <TouchableOpacity
          style={[styles.cancelBtn, isPending && styles.btnDisabled]}
          onPress={handleCancel}
          disabled={isPending}
        >
          <Text style={styles.cancelBtnText}>{isPending ? 'Annulation...' : 'Annuler la commande'}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#ef4444', fontSize: 15 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  orderId: { color: '#fff', fontSize: 20, fontWeight: '700', fontFamily: 'monospace' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  card: { backgroundColor: '#16213e', borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4a' },
  cardTitle: { color: '#666', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  cardValue: { color: '#fff', fontSize: 15, fontWeight: '600' },
  cardSub: { color: '#aaa', fontSize: 13, marginTop: 2 },
  total: { color: '#00e5cc', fontSize: 26, fontWeight: '800' },
  sectionTitle: { color: '#00e5cc', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  lineRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213e', borderRadius: 8, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: '#2a2a4a' },
  lineInfo: { flex: 1 },
  lineName: { color: '#fff', fontSize: 14, fontWeight: '500' },
  lineSub: { color: '#888', fontSize: 12, marginTop: 2 },
  lineQty: { color: '#aaa', fontSize: 13, marginRight: 12 },
  linePrice: { color: '#00e5cc', fontSize: 14, fontWeight: '600', minWidth: 80, textAlign: 'right' },
  payBtn: { backgroundColor: '#00e5cc', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  payBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  cancelBtn: { backgroundColor: 'transparent', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#ef4444' },
  cancelBtnText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
});
