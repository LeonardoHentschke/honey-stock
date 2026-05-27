// =============================================================================
// Edge Function: dispatch-reminders
// Chamada pelo pg_cron a cada minuto.
// Busca lembretes pendentes e envia push notifications via Expo Push API.
// =============================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async (req) => {
  // Verificar secret compartilhado
  const auth = req.headers.get('Authorization') ?? '';
  const expectedSecret = `Bearer ${Deno.env.get('FUNCTIONS_SHARED_SECRET')}`;
  if (auth !== expectedSecret) {
    return new Response('unauthorized', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Busca lembretes vencidos (SELECT ... FOR UPDATE SKIP LOCKED via RPC)
  const { data: due, error: rpcError } = await supabase.rpc('pick_due_reminders', {
    p_limit: 100,
  });

  if (rpcError) {
    console.error('[dispatch-reminders] RPC error:', rpcError);
    return new Response(JSON.stringify({ error: rpcError.message }), { status: 500 });
  }

  if (!due?.length) {
    return new Response('no-op', { status: 200 });
  }

  // Montar mensagens push
  const messages: object[] = [];
  const failedIds: string[] = [];
  const sentIds: string[] = [];

  for (const reminder of due) {
    const { data: tokens, error: tokenError } = await supabase
      .from('device_tokens')
      .select('expo_push_token')
      .in('user_id', reminder.recipient_ids);

    if (tokenError) {
      console.error(`[dispatch-reminders] Token fetch error for ${reminder.id}:`, tokenError);
      failedIds.push(reminder.id);
      continue;
    }

    for (const t of tokens ?? []) {
      messages.push({
        to: t.expo_push_token,
        title: reminder.title,
        body: reminder.body ?? '',
        data: {
          reminder_id: reminder.id,
          sale_id: reminder.sale_id ?? null,
        },
        sound: 'default',
        priority: 'high',
      });
    }

    sentIds.push(reminder.id);
  }

  // Enviar em lotes de 100 (limite da Expo Push API)
  const sendErrors: string[] = [];
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(batch),
      });
      if (!res.ok) {
        sendErrors.push(`HTTP ${res.status}: ${await res.text()}`);
      }
    } catch (err) {
      sendErrors.push(String(err));
    }
  }

  // Atualizar status dos lembretes com erros
  if (failedIds.length > 0) {
    await supabase
      .from('reminders')
      .update({ status: 'failed', error: 'Falha ao buscar tokens ou enviar push.' })
      .in('id', failedIds);
  }

  const summary = {
    sent: sentIds.length,
    failed: failedIds.length,
    pushErrors: sendErrors,
  };

  console.log('[dispatch-reminders] Summary:', summary);
  return new Response(JSON.stringify(summary), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
