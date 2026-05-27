import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Solicita permissão e registra o token no Supabase */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[Notifications] Push não funciona em emulador sem device.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Notifications] Permissão negada.');
    return null;
  }

  const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
  if (!projectId) {
    console.warn('[Notifications] EXPO_PUBLIC_PROJECT_ID não configurado.');
    return null;
  }

  const { data: tokenData } = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenData;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E89B12',
    });
  }

  // Faz upsert do token no Supabase
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return token;

  // TODO: remover cast após gerar tipos reais com `supabase gen types typescript`
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = profileRaw as any as { company_id: string } | null;
  if (!profile) return token;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('device_tokens') as any).upsert(
    {
      user_id: user.id,
      company_id: profile.company_id,
      expo_push_token: token,
      platform: Platform.OS,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'expo_push_token' }
  );

  return token;
}

/** Remove o token do Supabase ao fazer logout */
export async function unregisterPushToken(token: string): Promise<void> {
  await supabase.from('device_tokens').delete().eq('expo_push_token', token);
}
