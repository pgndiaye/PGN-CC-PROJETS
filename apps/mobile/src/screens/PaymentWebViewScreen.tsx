import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OrdersStackParamList } from '../navigation/AppNavigator';
import { MobileMoneyMethod, useInitiatePayment } from '../hooks/usePayment';

type Props = NativeStackScreenProps<OrdersStackParamList, 'PaymentInit'>;

const METHODS: Array<{ label: string; value: MobileMoneyMethod; color: string }> = [
  { label: '🌊 Wave', value: 'WAVE', color: '#00a8e8' },
  { label: '🟠 Orange Money', value: 'ORANGE_MONEY', color: '#ff6600' },
];

export default function PaymentWebViewScreen({ navigation, route }: Props) {
  const { orderId, total } = route.params;
  const [method, setMethod] = useState<MobileMoneyMethod>('WAVE');
  const [phone, setPhone] = useState('');

  const { mutateAsync: initiate, isPending } = useInitiatePayment();

  async function handlePay() {
    if (!phone.trim() || phone.trim().length < 8) {
      Alert.alert('Numéro invalide', 'Veuillez saisir le numéro de téléphone du client (8+ chiffres).');
      return;
    }

    try {
      const session = await initiate({
        orderId,
        paymentMethod: method,
        customerPhone: phone.trim(),
      });

      await Linking.openURL(session.checkoutUrl);
      navigation.goBack();
    } catch {
      Alert.alert('Erreur', 'Impossible d\'initier le paiement. Vérifiez votre connexion.');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.amountCard}>
        <Text style={styles.amountLabel}>Montant à encaisser</Text>
        <Text style={styles.amount}>{total.toLocaleString('fr-FR')} F CFA</Text>
      </View>

      <Text style={styles.sectionTitle}>Moyen de paiement</Text>
      <View style={styles.methodRow}>
        {METHODS.map((m) => (
          <TouchableOpacity
            key={m.value}
            style={[styles.methodBtn, method === m.value && { borderColor: m.color, backgroundColor: m.color + '22' }]}
            onPress={() => setMethod(m.value)}
          >
            <Text style={[styles.methodText, method === m.value && { color: m.color, fontWeight: '700' }]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Téléphone du client</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="7X XXX XX XX"
        placeholderTextColor="#666"
        keyboardType="phone-pad"
      />

      <Text style={styles.hint}>
        Le client recevra une notification sur son téléphone pour valider le paiement.
      </Text>

      <TouchableOpacity
        style={[styles.payBtn, isPending && styles.payBtnDisabled]}
        onPress={handlePay}
        disabled={isPending}
      >
        <Text style={styles.payBtnText}>
          {isPending ? 'Initialisation...' : 'Envoyer la demande de paiement'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  content: { padding: 16, paddingBottom: 40 },
  amountCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#00e5cc',
  },
  amountLabel: { color: '#aaa', fontSize: 13, marginBottom: 6 },
  amount: { color: '#00e5cc', fontSize: 32, fontWeight: '800' },
  sectionTitle: { color: '#00e5cc', fontSize: 13, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  methodRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  methodBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a4a',
    alignItems: 'center',
    backgroundColor: '#16213e',
  },
  methodText: { color: '#aaa', fontSize: 15 },
  input: {
    backgroundColor: '#16213e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a4a',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
    letterSpacing: 1,
  },
  hint: { color: '#666', fontSize: 12, textAlign: 'center', marginBottom: 24, lineHeight: 18 },
  payBtn: {
    backgroundColor: '#00e5cc',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
