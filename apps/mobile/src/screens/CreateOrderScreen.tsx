import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OrdersStackParamList } from '../navigation/AppNavigator';
import { CreateOrderLineInput, useCreateOrder } from '../hooks/useOrders';

type Props = NativeStackScreenProps<OrdersStackParamList, 'CreateOrder'>;

interface LineState {
  productName: string;
  productType: string;
  qty: string;
  unitPrice: string;
}

const emptyLine = (): LineState => ({
  productName: '',
  productType: '',
  qty: '1',
  unitPrice: '',
});

export default function CreateOrderScreen({ navigation, route }: Props) {
  const clientId = route.params?.clientId ?? '';
  const [clientIdInput, setClientIdInput] = useState(clientId);
  const [lines, setLines] = useState<LineState[]>([emptyLine()]);
  const [notes, setNotes] = useState('');

  const { mutateAsync: createOrder, isPending } = useCreateOrder();

  function updateLine(index: number, field: keyof LineState, value: string) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(index: number) {
    if (lines.length === 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function computeTotal() {
    return lines.reduce((sum, l) => {
      const qty = parseInt(l.qty, 10) || 0;
      const price = parseFloat(l.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
  }

  async function handleSubmit() {
    if (!clientIdInput.trim()) {
      Alert.alert('Client requis', 'Veuillez saisir un identifiant client.');
      return;
    }
    const validLines = lines.filter((l) => l.productName.trim() && parseInt(l.qty, 10) > 0 && parseFloat(l.unitPrice) > 0);
    if (validLines.length === 0) {
      Alert.alert('Lignes invalides', 'Au moins une ligne avec nom, quantité et prix est requise.');
      return;
    }

    const orderLines: CreateOrderLineInput[] = validLines.map((l) => ({
      productName: l.productName.trim(),
      productType: l.productType.trim() || undefined,
      qty: parseInt(l.qty, 10),
      unitPrice: parseFloat(l.unitPrice),
    }));

    try {
      const order = await createOrder({
        clientId: clientIdInput.trim(),
        lines: orderLines,
        notes: notes.trim() || undefined,
      });
      navigation.replace('OrderDetail', { id: order.id });
    } catch {
      Alert.alert('Erreur', 'Impossible de créer la commande. Vérifiez votre connexion.');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionTitle}>Client</Text>
      <TextInput
        style={styles.input}
        value={clientIdInput}
        onChangeText={setClientIdInput}
        placeholder="ID du client"
        placeholderTextColor="#666"
        autoCapitalize="none"
      />

      <Text style={styles.sectionTitle}>Lignes de commande</Text>
      {lines.map((line, i) => (
        <View key={i} style={styles.lineCard}>
          <View style={styles.lineHeader}>
            <Text style={styles.lineLabel}>Ligne {i + 1}</Text>
            {lines.length > 1 && (
              <TouchableOpacity onPress={() => removeLine(i)}>
                <Text style={styles.removeBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={styles.input}
            value={line.productName}
            onChangeText={(v) => updateLine(i, 'productName', v)}
            placeholder="Produit / service *"
            placeholderTextColor="#666"
          />
          <TextInput
            style={styles.input}
            value={line.productType}
            onChangeText={(v) => updateLine(i, 'productType', v)}
            placeholder="Type (ex: caméra, abonnement)"
            placeholderTextColor="#666"
          />
          <View style={styles.lineRow}>
            <TextInput
              style={[styles.input, styles.inputSmall]}
              value={line.qty}
              onChangeText={(v) => updateLine(i, 'qty', v)}
              placeholder="Qté"
              placeholderTextColor="#666"
              keyboardType="number-pad"
            />
            <TextInput
              style={[styles.input, styles.inputFlex]}
              value={line.unitPrice}
              onChangeText={(v) => updateLine(i, 'unitPrice', v)}
              placeholder="Prix unitaire (F CFA)"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>
          {line.qty && line.unitPrice ? (
            <Text style={styles.subtotal}>
              = {((parseInt(line.qty, 10) || 0) * (parseFloat(line.unitPrice) || 0)).toLocaleString('fr-FR')} F
            </Text>
          ) : null}
        </View>
      ))}

      <TouchableOpacity style={styles.addLineBtn} onPress={addLine}>
        <Text style={styles.addLineBtnText}>+ Ajouter une ligne</Text>
      </TouchableOpacity>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total estimé</Text>
        <Text style={styles.totalAmount}>{computeTotal().toLocaleString('fr-FR')} F CFA</Text>
      </View>

      <Text style={styles.sectionTitle}>Notes</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Remarques optionnelles..."
        placeholderTextColor="#666"
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        style={[styles.submit, isPending && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={isPending}
      >
        <Text style={styles.submitText}>
          {isPending ? 'Création en cours...' : 'Créer la commande'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { color: '#00e5cc', fontSize: 13, fontWeight: '700', marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    backgroundColor: '#16213e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a4a',
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#fff',
    fontSize: 15,
    marginBottom: 10,
  },
  lineCard: { backgroundColor: '#0f1a30', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#1e2d4a' },
  lineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  lineLabel: { color: '#aaa', fontSize: 13, fontWeight: '600' },
  removeBtn: { color: '#ff6b6b', fontSize: 16, fontWeight: '700' },
  lineRow: { flexDirection: 'row', gap: 8 },
  inputSmall: { width: 70 },
  inputFlex: { flex: 1 },
  subtotal: { color: '#00e5cc', fontSize: 13, fontWeight: '600', textAlign: 'right', marginTop: -4 },
  addLineBtn: { alignItems: 'center', paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#00e5cc', borderStyle: 'dashed', marginBottom: 20 },
  addLineBtnText: { color: '#00e5cc', fontSize: 14, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderColor: '#2a2a4a', marginBottom: 8 },
  totalLabel: { color: '#aaa', fontSize: 14 },
  totalAmount: { color: '#fff', fontSize: 18, fontWeight: '800' },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  submit: { backgroundColor: '#00e5cc', borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 16 },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
