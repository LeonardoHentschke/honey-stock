import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { X, Check } from 'lucide-react-native';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  visible: boolean;
  title: string;
  options: Option<T>[];
  selected: T;
  onSelect: (value: T) => void;
  onClose: () => void;
}

export function OptionPickerSheet<T extends string>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: Props<T>) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
            <X size={20} color="#6B6258" />
          </Pressable>
        </View>

        <View style={styles.list}>
          {options.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.row, selected === opt.value && styles.rowSelected]}
              onPress={() => { onSelect(opt.value); onClose(); }}
            >
              <Text style={[styles.rowLabel, selected === opt.value && styles.rowLabelSelected]}>
                {opt.label}
              </Text>
              {selected === opt.value ? (
                <Check size={18} color="#C47C0A" />
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F1EA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1F1B16' },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E7E2D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingHorizontal: 24, gap: 8 },
  row: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  rowSelected: { borderColor: '#E89B12' },
  rowLabel: { fontSize: 16, color: '#3B342B' },
  rowLabelSelected: { fontWeight: '700', color: '#C47C0A' },
});
