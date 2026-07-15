import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ActivityIndicator,
  Share,
  StyleSheet,
} from 'react-native';
import { Copy } from 'lucide-react-native';

interface InviteCodeModalProps {
  visible: boolean;
  code: string | null | undefined;
  isLoading: boolean;
  onClose: () => void;
}

/** Modal do código de convite da empresa — usado nas telas Mais e Equipe. */
export function InviteCodeModal({ visible, code, isLoading, onClose }: InviteCodeModalProps) {
  const handleShare = async () => {
    if (!code) return;
    await Share.share({ message: `Entre no Mel Manager com o código de convite: ${code}` });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>Código de convite</Text>
          <Text style={styles.subtitle}>Compartilhe com quem vai entrar na empresa</Text>

          {isLoading ? (
            <ActivityIndicator size="large" color="#E89B12" style={styles.loader} />
          ) : (
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{code ?? '——'}</Text>
            </View>
          )}

          <View style={styles.actions}>
            <Pressable
              style={styles.shareBtn}
              android_ripple={{ color: 'rgba(155,95,11,0.12)' }}
              onPress={handleShare}
              disabled={!code}
            >
              <Copy size={16} color="#9B5F0B" />
              <Text style={styles.shareBtnText}>Compartilhar</Text>
            </Pressable>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Fechar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(31,27,22,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: '#1F1B16',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B6258',
    textAlign: 'center',
    marginBottom: 20,
  },
  loader: { marginVertical: 24 },
  codeBox: {
    backgroundColor: '#FCEFC8',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 32,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F9DE91',
  },
  codeText: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    color: '#9B5F0B',
    letterSpacing: 6,
  },
  actions: { width: '100%', gap: 10 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FCEFC8',
    borderRadius: 12,
    paddingVertical: 14,
  },
  shareBtnText: { fontSize: 15, fontWeight: '600', color: '#9B5F0B' },
  closeBtn: { alignItems: 'center', paddingVertical: 12 },
  closeBtnText: { fontSize: 15, fontWeight: '500', color: '#6B6258' },
});
