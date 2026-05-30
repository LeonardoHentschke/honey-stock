import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ArrowLeft, Search, UserRound, ChevronRight, CalendarClock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatCurrency } from '@/shared/lib/format';
import { useNewSaleViewModel } from '../viewmodels/useNewSaleViewModel';
import { CHANNEL_LABELS, PAYMENT_LABELS, type SaleChannel, type PaymentMethod } from '../models/salesService';
import { CartItemRow } from './components/CartItemRow';
import { VariantSearchSheet } from './components/VariantSearchSheet';
import { CustomerSelectorSheet } from './components/CustomerSelectorSheet';
import { OptionPickerSheet } from './components/OptionPickerSheet';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SalesStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<SalesStackParamList, 'NewSale'>;

const CHANNEL_OPTIONS: { value: SaleChannel; label: string }[] = [
  { value: 'store', label: CHANNEL_LABELS.store },
  { value: 'fair', label: CHANNEL_LABELS.fair },
  { value: 'delivery', label: CHANNEL_LABELS.delivery },
  { value: 'resale', label: CHANNEL_LABELS.resale },
  { value: 'other', label: CHANNEL_LABELS.other },
];

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: PAYMENT_LABELS.cash },
  { value: 'card', label: PAYMENT_LABELS.card },
  { value: 'pix', label: PAYMENT_LABELS.pix },
  { value: 'credit', label: PAYMENT_LABELS.credit },
  { value: 'other', label: PAYMENT_LABELS.other },
];

export function NewSaleScreen({ navigation }: Props) {
  const { top, bottom } = useSafeAreaInsets();
  const vm = useNewSaleViewModel();

  const [showVariantSheet, setShowVariantSheet] = useState(false);
  const [showCustomerSheet, setShowCustomerSheet] = useState(false);
  const [showChannelSheet, setShowChannelSheet] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [discountText, setDiscountText] = useState('0');

  function applyDateMask(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }

  function applyTimeMask(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  }

  // Navega de volta após sucesso
  useEffect(() => {
    if (vm.isSuccess) {
      navigation.goBack();
    }
  }, [vm.isSuccess, navigation]);

  function handleSubmit() {
    if (vm.cartItems.length === 0) {
      Alert.alert('Carrinho vazio', 'Adicione ao menos um produto.');
      return;
    }
    vm.submitSale();
  }



  function handleDiscountChange(text: string) {
    setDiscountText(text);
    const parsed = parseFloat(text.replace(',', '.'));
    vm.setDiscount(isNaN(parsed) ? 0 : parsed);
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={bottom}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backBtn}>
          <ArrowLeft size={22} color="#1F1B16" />
        </Pressable>
        <Text style={styles.title}>Nova venda</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Botão de busca de produto */}
      <Pressable style={styles.searchBar} onPress={() => setShowVariantSheet(true)}>
        <Search size={18} color="#A89E91" />
        <Text style={styles.searchPlaceholder}>Adicionar produto...</Text>
      </Pressable>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Carrinho */}
        <Text style={styles.sectionLabel}>
          Carrinho{vm.cartItems.length > 0 ? ` (${vm.cartItems.length})` : ''}
        </Text>

        {vm.cartItems.length === 0 ? (
          <View style={styles.emptyCart}>
            <Text style={styles.emptyCartText}>Nenhum produto adicionado</Text>
          </View>
        ) : (
          <View style={styles.cartList}>
            {vm.cartItems.map((item) => (
              <CartItemRow key={item.variantId} item={item} onUpdateQty={vm.updateQty} />
            ))}
          </View>
        )}

        {/* Separador */}
        <View style={styles.separator} />

        {/* Campos do pedido */}
        <FormRow
          label="Cliente"
          value={vm.selectedCustomer?.name ?? 'Sem cliente (avulso)'}
          icon={<UserRound size={16} color="#A89E91" />}
          onPress={() => setShowCustomerSheet(true)}
        />

        <FormRow
          label="Canal"
          value={CHANNEL_LABELS[vm.channel]}
          onPress={() => setShowChannelSheet(true)}
        />

        <FormRow
          label="Pagamento"
          value={PAYMENT_LABELS[vm.paymentMethod]}
          onPress={() => setShowPaymentSheet(true)}
        />

        {/* Desconto */}
        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Desconto (R$)</Text>
          <TextInput
            style={styles.discountInput}
            value={discountText}
            onChangeText={handleDiscountChange}
            keyboardType="decimal-pad"
            selectTextOnFocus
          />
        </View>

        {/* Agendar entrega */}
        <View style={styles.scheduleToggleRow}>
          <View style={styles.scheduleToggleLeft}>
            <CalendarClock size={18} color={vm.isScheduled ? '#C47C0A' : '#A89E91'} />
            <Text style={[styles.scheduleToggleLabel, vm.isScheduled && styles.scheduleToggleLabelActive]}>
              Agendar entrega
            </Text>
          </View>
          <Switch
            value={vm.isScheduled}
            onValueChange={vm.setIsScheduled}
            trackColor={{ false: '#E7E2D9', true: '#FCEFC8' }}
            thumbColor={vm.isScheduled ? '#C47C0A' : '#A89E91'}
          />
        </View>

        {vm.isScheduled ? (
          <View style={styles.scheduleDateRow}>
            <View style={styles.scheduleDateField}>
              <Text style={styles.scheduleDateLabel}>Data</Text>
              <TextInput
                style={styles.scheduleDateInput}
                value={vm.scheduledDateText}
                onChangeText={(t) => vm.setScheduledDateText(applyDateMask(t))}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#A89E91"
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
            <View style={styles.scheduleDateField}>
              <Text style={styles.scheduleDateLabel}>Hora</Text>
              <TextInput
                style={styles.scheduleDateInput}
                value={vm.scheduledTimeText}
                onChangeText={(t) => vm.setScheduledTimeText(applyTimeMask(t))}
                placeholder="HH:MM"
                placeholderTextColor="#A89E91"
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
          </View>
        ) : null}

        {vm.schedulingError ? (
          <Text style={styles.errorText}>{vm.schedulingError}</Text>
        ) : null}

        {/* Erro */}
        {vm.submitError ? (
          <Text style={styles.errorText}>{vm.submitError}</Text>
        ) : null}
      </ScrollView>

      {/* Footer com total e botão */}
      <View style={[styles.footer, { paddingBottom: bottom + 16 }]}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(vm.total)}</Text>
        </View>
        <Pressable
          style={[styles.submitBtn, vm.isSubmitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={vm.isSubmitting}
        >
          {vm.isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>
              {vm.isScheduled ? 'Agendar entrega' : 'Finalizar venda'}
            </Text>
          )}
        </Pressable>
      </View>

      {/* Sheets */}
      <VariantSearchSheet
        visible={showVariantSheet}
        variants={vm.filteredVariants}
        isLoading={vm.isLoadingVariants}
        query={vm.variantQuery}
        onQueryChange={vm.setVariantQuery}
        onSelect={vm.addToCart}
        onClose={() => {
          setShowVariantSheet(false);
          vm.setVariantQuery('');
        }}
      />

      <CustomerSelectorSheet
        visible={showCustomerSheet}
        customers={vm.customers}
        isLoading={vm.isLoadingCustomers}
        selectedId={vm.selectedCustomer?.id ?? null}
        onSelect={vm.selectCustomer}
        onClose={() => setShowCustomerSheet(false)}
      />

      <OptionPickerSheet
        visible={showChannelSheet}
        title="Canal de venda"
        options={CHANNEL_OPTIONS}
        selected={vm.channel}
        onSelect={vm.setChannel}
        onClose={() => setShowChannelSheet(false)}
      />

      <OptionPickerSheet
        visible={showPaymentSheet}
        title="Forma de pagamento"
        options={PAYMENT_OPTIONS}
        selected={vm.paymentMethod}
        onSelect={vm.setPaymentMethod}
        onClose={() => setShowPaymentSheet(false)}
      />
    </KeyboardAvoidingView>
  );
}

function FormRow({
  label,
  value,
  icon,
  onPress,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.formRow} onPress={onPress}>
      <Text style={styles.formLabel}>{label}</Text>
      <View style={styles.formValue}>
        {icon}
        <Text style={styles.formValueText} numberOfLines={1}>
          {value}
        </Text>
        <ChevronRight size={16} color="#A89E91" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F1EA' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1F1B16', flex: 1 },
  headerSpacer: { width: 40 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E7E2D9',
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchPlaceholder: { fontSize: 15, color: '#A89E91', flex: 1 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 16, gap: 10 },

  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#6B6258', textTransform: 'uppercase', letterSpacing: 0.5 },

  emptyCart: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7E2D9',
    borderStyle: 'dashed',
  },
  emptyCartText: { fontSize: 14, color: '#A89E91' },

  cartList: { gap: 10 },

  separator: { height: 1, backgroundColor: '#E7E2D9', marginVertical: 4 },

  formRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  formLabel: { fontSize: 15, color: '#3B342B', fontWeight: '500' },
  formValue: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'flex-end' },
  formValueText: { fontSize: 15, color: '#6B6258', maxWidth: 200 },
  discountInput: {
    fontSize: 15,
    color: '#1F1B16',
    fontWeight: '600',
    textAlign: 'right',
    minWidth: 80,
    paddingVertical: 0,
  },

  scheduleToggleRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  scheduleToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scheduleToggleLabel: { fontSize: 15, color: '#6B6258', fontWeight: '500' },
  scheduleToggleLabelActive: { color: '#3B342B', fontWeight: '600' },

  scheduleDateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  scheduleDateField: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 4,
  },
  scheduleDateLabel: { fontSize: 11, fontWeight: '600', color: '#A89E91', textTransform: 'uppercase', letterSpacing: 0.4 },
  scheduleDateInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F1B16',
    paddingVertical: 0,
  },

  errorText: { fontSize: 14, color: '#B3261E', textAlign: 'center' },

  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E7E2D9',
    gap: 12,
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontSize: 16, color: '#6B6258', fontWeight: '500' },
  totalValue: { fontSize: 32, fontWeight: '700', color: '#1F1B16' },
  submitBtn: {
    backgroundColor: '#E89B12',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E89B12',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
});
