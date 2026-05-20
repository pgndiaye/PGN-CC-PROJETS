import React, { useState } from 'react';
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
import { CloudStackParamList } from '../navigation/AppNavigator';
import { useSubscription, useRenewSubscription } from '../hooks/useCloud';

type Props = NativeStackScreenProps<CloudStackParamList, 'CloudDetail'>;

const PLAN_OPTIONS = [1, 3, 6, 12];

export default function CloudDetailScreen({ route }: Props) {
  const { id } = route.params;
  const { data: sub, isLoading, error } = useSubscription(id);
  const { mutateAsync: renew, isPending } = useRenewSubscription();
  const [showRenew, setShowRenew] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#00e5cc" size="large" />
      </View>
    );
  }

  if (error || !sub) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Abonnement introuvable</Text>
      </View>
    );
  }

  async function handleRenew(months: number) {
    try {
      await renew({ id, additionalMonths: months });
      setShowRenew(false);
      Alert.alert('Renouvellé', `Abonnement prolongé de ${months} mois.`);
    } catch {
      Alert.alert('Erreur', 'Impossible de renouveler l\'abonnement.');
    }
  }

  const daysLeft = Math.ceil(
    (new Date(sub.expiresAt).getTime() - Date.now()) / 86_400_000,
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.statusBanner, sub.isActive ? styles.bannerActive : styles.bannerExpired]}>
        <Text style={styles.statusText}>
          {sub.isActive ? (daysLeft <= 30 ? `⚠️ Expire dans ${daysLeft} jours` : '✅ Actif') : '❌ Expiré'}
        </Text>
      </View>

      <View style={styles.card}>
        <InfoRow label="Client" value={sub.client.name} />
        <InfoRow label="Numéro de série" value={sub.serialNumber} />
        <InfoRow label="Plan" value={`${sub.planMonths} mois`} />
        <InfoRow label="Activé le" value={new Date(sub.activatedAt).toLocaleDateString('fr-SN')} />
        <InfoRow label="Expire le" value={new Date(sub.expiresAt).toLocaleDateString('fr-SN')} />
        {sub.notes && <InfoRow label="Notes" value={sub.notes} />}
      </View>

      {!showRenew ? (
        <TouchableOpacity style={styles.renewBtn} onPress={() => setShowRenew(true)}>
          <Text style={styles.renewBtnText}>Renouveler l'abonnement</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.renewPanel}>
          <Text style={styles.renewTitle}>Choisir la durée de renouvellement</Text>
          <View style={styles.planGrid}>
            {PLAN_OPTIONS.map((months) => (
              <TouchableOpacity
                key={months}
                style={styles.planBtn}
                onPress={() => handleRenew(months)}
                disabled={isPending}
              >
                <Text style={styles.planBtnText}>{months} mois</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={() => setShowRenew(false)}>
            <Text style={styles.cancel}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#ff6b6b', fontSize: 15 },
  statusBanner: { borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 16 },
  bannerActive: { backgroundColor: '#0a2a1a' },
  bannerExpired: { backgroundColor: '#2a0a0a' },
  statusText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  card: { backgroundColor: '#16213e', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#2a2a4a', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2a2a4a' },
  label: { color: '#888', fontSize: 13 },
  value: { color: '#fff', fontSize: 13, fontWeight: '500', flexShrink: 1, textAlign: 'right', marginLeft: 8 },
  renewBtn: { backgroundColor: '#00e5cc', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  renewBtnText: { color: '#000', fontWeight: '700', fontSize: 15 },
  renewPanel: { backgroundColor: '#16213e', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#00e5cc' },
  renewTitle: { color: '#fff', fontWeight: '600', fontSize: 14, marginBottom: 12 },
  planGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  planBtn: { backgroundColor: '#0a2a2a', borderRadius: 8, borderWidth: 1, borderColor: '#00e5cc', paddingVertical: 10, paddingHorizontal: 20 },
  planBtnText: { color: '#00e5cc', fontWeight: '600' },
  cancel: { color: '#888', textAlign: 'center', fontSize: 13, paddingVertical: 4 },
});
