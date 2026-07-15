import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Switch,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Plus, UserRound, ChevronRight, CalendarClock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { AppTabsParamList } from '@/navigation/types';
import { formatCurrency } from '@/shared/lib/format';
import { maskCurrency, currencyToNumber } from '@/shared/lib/mask';
import { DateTimeField } from '@/shared/components/DateTimeField';
import { useToastStore } from '@/shared/stores/toastStore';
import { useNewSaleViewModel } from '../viewmodels/useNewSaleViewModel';
import { PAYMENT_LABELS, type PaymentMethod } from '../models/salesService';
import { CartItemRow } from './components/CartItemRow';
import { ProductSearchSheet } from './components/ProductSearchSheet';
import { CustomerSelectorSheet } from './components/CustomerSelectorSheet';

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: PAYMENT_LABELS.cash },
  { value: 'pix', label: PAYMENT_LABELS.pix },
];

const PAY_MODES = [
  { key: 'full', label: 'Pago' },
  { key: 'partial', label: 'Parcial' },
  { key: 'later', label: 'A prazo' },
] as const;

export function NewSaleScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<AppTabsParamList>>();
  const vm = useNewSaleViewModel({
    onSaleCreated: (saleId) =>
      navigation.navigate('More', { screen: 'SaleDetail', params: { saleId } }),
  });

  const [showProductSheet, setShowProductSheet] = useState(false);
  const [showCustomerSheet, setShowCustomerSheet] = useState(false);
  const [discountText, setDiscountText] = useState('');
  const showToast = useToastStore((s) => s.show);

  // Confirma o sucesso e permanece no PDV (o carrinho já é resetado no view model)
  useEffect(() => {
    if (vm.isSuccess) {
      setDiscountText('');
      showToast({ type: 'success', title: 'Venda registrada' });
    }
  }, [vm.isSuccess, showToast]);

  function handleSubmit() {
    if (vm.cartItems.length === 0) {
      Alert.alert('Carrinho vazio', 'Adicione ao menos um produto.');
      return;
    }
    vm.submitSale();
  }



  function handleDiscountChange(text: string) {
    const masked = maskCurrency(text);
    setDiscountText(masked);
    vm.setDiscount(currencyToNumber(masked));
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: top + 12 }]}>
        <Text style={styles.title}>Nova venda</Text>
        {/* espaçador de 40dp: mantém o título na mesma posição vertical das
            telas cujo header tem botão de 40dp */}
        <View style={styles.headerSpacer} />
      </View>

      {/* Botão de adicionar produto */}
      <Pressable
        style={styles.addProductBtn}
        android_ripple={{ color: 'rgba(155,95,11,0.12)' }}
        onPress={() => setShowProductSheet(true)}
      >
        <Plus size={20} color="#9B5F0B" />
        <Text style={styles.addProductText}>Adicionar produto</Text>
      </Pressable>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
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
              <CartItemRow key={item.productId} item={item} onUpdateQty={vm.updateQty} />
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

        {/* Forma de pagamento — só 2 opções, escolha direta por chips */}
        <View style={styles.payCard}>
          <Text style={styles.formLabel}>Forma de pagamento</Text>
          <View style={styles.payModeRow}>
            {PAYMENT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[
                  styles.payModeChip,
                  vm.paymentMethod === opt.value && styles.payModeChipActive,
                ]}
                onPress={() => vm.setPaymentMethod(opt.value)}
              >
                <Text
                  style={[
                    styles.payModeChipText,
                    vm.paymentMethod === opt.value && styles.payModeChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Desconto */}
        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Desconto (R$)</Text>
          <TextInput
            style={styles.discountInput}
            value={discountText}
            onChangeText={handleDiscountChange}
            placeholder="0,00"
            placeholderTextColor="#A89E91"
            keyboardType="decimal-pad"
          />
        </View>

        {/* Pagamento recebido */}
        <View style={styles.payCard}>
          <Text style={styles.formLabel}>Pagamento</Text>
          <View style={styles.payModeRow}>
            {PAY_MODES.map((opt) => (
              <Pressable
                key={opt.key}
                style={[styles.payModeChip, vm.paymentMode === opt.key && styles.payModeChipActive]}
                onPress={() => vm.setPaymentMode(opt.key)}
              >
                <Text
                  style={[
                    styles.payModeChipText,
                    vm.paymentMode === opt.key && styles.payModeChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
          {vm.paymentMode === 'partial' ? (
            <View style={styles.payPartialRow}>
              <Text style={styles.formLabel}>Valor pago (R$)</Text>
              <TextInput
                style={styles.discountInput}
                value={vm.paidAmountText}
                onChangeText={(t) => vm.setPaidAmountText(maskCurrency(t))}
                placeholder="0,00"
                placeholderTextColor="#A89E91"
                keyboardType="decimal-pad"
              />
            </View>
          ) : null}
          {vm.remaining > 0 ? (
            <Text style={styles.payRemaining}>Falta receber {formatCurrency(vm.remaining)}</Text>
          ) : null}
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
              <DateTimeField
                mode="date"
                value={vm.scheduledFor}
                onChange={vm.setScheduledFor}
                minimumDate={new Date()}
                style={styles.scheduleDateInput}
              />
            </View>
            <View style={styles.scheduleDateField}>
              <Text style={styles.scheduleDateLabel}>Hora</Text>
              <DateTimeField
                mode="time"
                value={vm.scheduledFor}
                onChange={vm.setScheduledFor}
                style={styles.scheduleDateInput}
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
      </KeyboardAwareScrollView>

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
      <ProductSearchSheet
        visible={showProductSheet}
        products={vm.filteredProducts}
        isLoading={vm.isLoadingProducts}
        query={vm.productQuery}
        onQueryChange={vm.setProductQuery}
        onSelect={vm.addToCart}
        onClose={() => {
          setShowProductSheet(false);
          vm.setProductQuery('');
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
    </View>
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
  headerSpacer: { width: 40, height: 40 },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700', color: '#1F1B16', flex: 1 },

  addProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    marginBottom: 12,
    backgroundColor: '#FCEFC8',
    borderRadius: 12,
    height: 52,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#F0D48A',
    overflow: 'hidden',
  },
  addProductText: { fontSize: 15, fontWeight: '600', color: '#9B5F0B' },

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

  payCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  payModeRow: { flexDirection: 'row', gap: 8 },
  payModeChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F5F1EA',
    alignItems: 'center',
  },
  payModeChipActive: { backgroundColor: '#FCEFC8' },
  payModeChipText: { fontSize: 13, color: '#A89E91', fontWeight: '500' },
  payModeChipTextActive: { color: '#9B5F0B', fontWeight: '600' },
  payPartialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F2EDE4',
    paddingTop: 12,
  },
  payRemaining: { fontSize: 13, color: '#9B5F0B', fontWeight: '600' },

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
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
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
