import React, { useState } from 'react';
import {
  Text,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Calendar, Clock } from 'lucide-react-native';
import { formatDate, formatTime } from '@/shared/lib/format';
import { DatePickerSheet } from './DatePickerSheet';
import { TimePickerSheet } from './TimePickerSheet';

interface Props {
  value: Date | null;
  mode: 'date' | 'time';
  onChange: (date: Date) => void;
  /** Valor inicial do picker quando `value` é null. Default: agora. */
  defaultPickerValue?: Date;
  minimumDate?: Date;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Campo de data ou hora que abre os pickers próprios do app
 * (DatePickerSheet / TimePickerSheet), iguais nas duas plataformas.
 */
export function DateTimeField({
  value,
  mode,
  onChange,
  defaultPickerValue,
  minimumDate,
  placeholder,
  style,
}: Props) {
  const [pickerVisible, setPickerVisible] = useState(false);

  const initialValue = defaultPickerValue ?? new Date();
  const displayText = value ? (mode === 'date' ? formatDate(value) : formatTime(value)) : null;
  const Icon = mode === 'date' ? Calendar : Clock;

  return (
    <>
      <Pressable style={[styles.field, style]} onPress={() => setPickerVisible(true)}>
        <Text style={displayText ? styles.fieldText : styles.fieldPlaceholder}>
          {displayText ?? placeholder ?? (mode === 'date' ? 'Selecionar data' : 'Selecionar hora')}
        </Text>
        <Icon size={18} color="#A89E91" />
      </Pressable>

      {mode === 'date' ? (
        <DatePickerSheet
          visible={pickerVisible}
          value={value}
          initialValue={initialValue}
          minimumDate={minimumDate}
          onConfirm={onChange}
          onClose={() => setPickerVisible(false)}
        />
      ) : (
        <TimePickerSheet
          visible={pickerVisible}
          value={value}
          initialValue={initialValue}
          onConfirm={onChange}
          onClose={() => setPickerVisible(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E2D9',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fieldText: { fontSize: 15, color: '#1F1B16' },
  fieldPlaceholder: { fontSize: 15, color: '#A89E91' },
});
