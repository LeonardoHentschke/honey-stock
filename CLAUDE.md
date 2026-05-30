# App de Controle de Estoque e Vendas — Mel

Contexto técnico para o Claude Code. Este documento descreve **arquitetura, modelo de dados e regras de implementação**.

> 📐 **Para decisões visuais, consulte `DESIGN.md`** (paleta, tipografia, componentes, layouts).
> Se houver conflito entre os dois: este arquivo manda em decisões técnicas; `DESIGN.md` manda em decisões visuais.

---

## 1. Domínio do negócio

App mobile para gestão de **estoque e vendas de mel** (produção própria / pequeno apicultor familiar).

- **Quem usa:** o dono e familiares, sobre uma **mesma base compartilhada**.
- **Volume esperado:** baixo a médio (centenas de produtos, milhares de vendas/ano).
- **Operação:** sempre online, sem necessidade de offline no MVP.
- **Não é PDV fiscal** — não emite NFC-e. Apenas controle interno.

### Particularidades do mel
- Produtos têm **variações**: tipo (silvestre, eucalipto, laranjeira, etc.) e **embalagem/peso** (250g, 500g, 1kg, bisnaga, sachê, pote de vidro, balde 25kg).
- Unidades: **un** (potes/bisnagas) e **kg** (granel).
- **Lote** para rastreabilidade (data de envase, validade).
- Canais de venda: feira, entrega, revenda. Campo `sales.channel`.
- **Dois tipos de cliente:** consumidor final (varejo) e revenda (atacado, preço diferenciado).

---

## 2. Stack (decisões fechadas)

| Camada | Escolha |
|---|---|
| Mobile | **React Native + Expo SDK 51+** |
| Linguagem | **TypeScript** estrito |
| Padrão | **MVVM** (View / ViewModel via hooks / Model via services) |
| Navegação | **React Navigation v6** (stack + bottom tabs) |
| Estado servidor | **@tanstack/react-query** |
| Estado UI | **Zustand** |
| Formulários | **react-hook-form** + **zod** |
| Estilização | **NativeWind** (Tailwind) |
| UI components | **React Native Reusables (RNR)** |
| Ícones | **lucide-react-native** |
| Backend | **Supabase** (Postgres + Auth + Storage + RLS + Edge Functions + pg_cron) |
| Auth | Supabase Auth — email/senha + Google OAuth |
| Storage seguro | **expo-secure-store** |
| Gráficos | **victory-native** |
| Notificações | **expo-notifications** + Expo Push API |
| Build | **EAS Build** |

### Permissões
Sem RBAC no MVP. Todos os usuários autenticados da mesma empresa têm acesso total.

---

## 3. Arquitetura

```
App Mobile (RN + Expo)
 ├─ View (screens, componentes RNR)
 ├─ ViewModel (hooks)
 └─ Model (services)
            │
            ▼
       Supabase
   Auth · Postgres+RLS · Storage · Edge Functions · pg_cron
            │
            ▼ (a cada minuto)
   Edge Function `dispatch-reminders`
            │
            ▼
       Expo Push API → dispositivos
```

### Estrutura de pastas

```
src/
├── app/                    # entry, providers (QueryClient, Auth, Theme)
├── navigation/             # RootNavigator, AppTabs, AuthStack, types
├── features/
│   ├── auth/
│   │   ├── views/
│   │   ├── viewmodels/
│   │   └── models/
│   ├── products/
│   ├── inventory/
│   ├── sales/
│   ├── customers/
│   ├── suppliers/
│   ├── reminders/
│   ├── reports/
│   └── dashboard/
├── components/
│   └── ui/                 # RNR (gerado pela CLI)
├── shared/
│   ├── components/         # composições próprias por cima do RNR
│   ├── hooks/              # useDebounce, useAuth, useNotifications
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── format.ts
│   │   └── notifications.ts
│   ├── stores/             # Zustand
│   └── types/              # database.types.ts (gerado pelo Supabase)
└── theme/                  # tokens (espelham DESIGN.md), tailwind config
```

### Convenções MVVM

- **View nunca chama service direto.** Sempre via ViewModel.
- **ViewModel é um hook** `useXxxViewModel()` que retorna `{ data, actions, state }`.
- **Service é puro** — recebe input, retorna domínio, lança erro tipado.
- **Tipos do banco** gerados via `supabase gen types typescript` em `shared/types/database.types.ts`.
- Validação **sempre** com Zod no ViewModel antes de chamar o Model.

### React Native Reusables

RNR copia o código do componente para `components/ui/`. Cada componente fica sob controle do projeto.

```
npx @react-native-reusables/cli@latest init
npx @react-native-reusables/cli@latest add button input card dialog
```

Componentes usados: `Button`, `Input`, `Label`, `Card`, `Dialog`, `AlertDialog`, `Badge`, `Avatar`, `Checkbox`, `Switch`, `Select`, `Tabs`, `Toast`, `Skeleton`, `Separator`.

**Regra:** sempre tentar componente RNR antes de criar do zero. Composições específicas de domínio (`ProductCard`, `SaleSummary`) vão em `shared/components` ou `features/<x>/views/components`. Variantes visuais (cores, tamanhos) devem refletir os tokens do `DESIGN.md` (seção 5).

### Exemplo canônico

```ts
// features/products/models/productService.ts
export const productService = {
  list: async (filters?: ProductFilters): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*), variant:product_variants(*)')
      .order('name');
    if (error) throw new ServiceError(error.message, error);
    return data ?? [];
  },
};

// features/products/viewmodels/useProductListViewModel.ts
export function useProductListViewModel() {
  const [search, setSearch] = useState('');
  const query = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.list(),
  });
  const filtered = useMemo(() =>
    (query.data ?? []).filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase())
    ), [query.data, search]);
  return {
    products: filtered,
    isLoading: query.isLoading,
    error: query.error,
    search, setSearch,
    refresh: query.refetch,
  };
}

// features/products/views/ProductListScreen.tsx
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export function ProductListScreen() {
  const vm = useProductListViewModel();
  if (vm.isLoading) return <Loading />;
  return (
    <Screen>
      <Input value={vm.search} onChangeText={vm.setSearch} placeholder="Buscar..." />
      <FlatList
        data={vm.products}
        renderItem={({ item }) => (
          <Card><ProductRow product={item} /></Card>
        )}
      />
    </Screen>
  );
}
```

---

## 4. Modelo de dados (Postgres / Supabase)

Todas as tabelas com `company_id` têm **RLS habilitado**. PKs em **UUID** com `gen_random_uuid()`.

### Diagrama

```
companies ──┬── profiles (auth.users 1:1) ──< device_tokens
            ├── categories ──< products
            ├── products ──< product_variants ──< stock_movements
            ├── batches ──< stock_movements
            ├── customers (type: final | reseller) ──< sales
            ├── suppliers ──< stock_movements
            ├── sales ──< sale_items >── product_variants
            │       └──< reminders >── reminder_recipients >── profiles
            └── reminders (também avulsos, sem sale_id)
```

### Particularidades

**Produto vs. variante.** `products` = conceito ("Mel silvestre"). `product_variants` = SKU vendável ("Mel silvestre 500g pote de vidro"). Estoque e preço vivem na variante.

**Cliente final vs. revenda.** Coluna `type` em `customers`. Revendas têm `business_name` e `reseller_discount_percent`. Variantes podem ter `reseller_price` explícito; se nulo, aplica desconto percentual do cliente.

**Vendas agendadas.** Coluna `scheduled_for` em `sales`. Se preenchida, a baixa de estoque só ocorre quando a venda vira `delivered` ou `completed`. Status: `scheduled`, `completed`, `delivered`, `canceled`.

**Lembretes.** Tabela `reminders` (com `sale_id` opcional) + `reminder_recipients` (multi-destinatário). Disparo via **pg_cron + Edge Function**.

### Schema SQL

```sql
-- =====================================================
-- Extensões
-- =====================================================
create extension if not exists "pgcrypto";
create extension if not exists "pg_cron";
create extension if not exists "pg_net";

-- =====================================================
-- companies
-- =====================================================
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null default upper(substr(md5(random()::text), 1, 6)),
  created_at timestamptz not null default now()
);

-- =====================================================
-- profiles
-- =====================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references companies(id) on delete restrict,
  full_name text not null,
  created_at timestamptz not null default now()
);
create index on profiles(company_id);

-- =====================================================
-- device_tokens
-- =====================================================
create table device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index on device_tokens(user_id);

-- =====================================================
-- categories
-- =====================================================
create table categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (company_id, name)
);
create index on categories(company_id);

-- =====================================================
-- products
-- =====================================================
create table products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  name text not null,
  description text,
  honey_type text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on products(company_id);

-- =====================================================
-- product_variants
-- =====================================================
create table product_variants (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  sku text not null,
  packaging text,
  weight_grams numeric(10,2),
  unit text not null default 'un',
  cost_price numeric(12,2) not null default 0,
  sale_price numeric(12,2) not null default 0,
  reseller_price numeric(12,2),
  stock_quantity numeric(12,3) not null default 0,
  min_stock numeric(12,3) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, sku)
);
create index on product_variants(company_id);
create index on product_variants(product_id);

-- =====================================================
-- batches
-- =====================================================
create table batches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  code text not null,
  harvested_at date,
  expires_at date,
  notes text,
  created_at timestamptz not null default now(),
  unique (company_id, code)
);
create index on batches(company_id);

-- =====================================================
-- suppliers
-- =====================================================
create table suppliers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  document text, phone text, email text, address text, notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on suppliers(company_id);

-- =====================================================
-- customers
-- =====================================================
create type customer_type as enum ('final', 'reseller');

create table customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  type customer_type not null default 'final',
  name text not null,
  business_name text,
  document text,
  phone text,
  email text,
  address text,
  reseller_discount_percent numeric(5,2),
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on customers(company_id);
create index on customers(type);

-- =====================================================
-- stock_movements
-- =====================================================
create type stock_movement_type as enum ('in', 'out', 'adjust', 'sale');

create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  variant_id uuid not null references product_variants(id) on delete restrict,
  batch_id uuid references batches(id) on delete set null,
  type stock_movement_type not null,
  quantity numeric(12,3) not null,
  unit_cost numeric(12,2),
  supplier_id uuid references suppliers(id) on delete set null,
  reference_type text,
  reference_id uuid,
  notes text,
  user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index on stock_movements(company_id);
create index on stock_movements(variant_id);
create index on stock_movements(created_at desc);

-- =====================================================
-- sales
-- =====================================================
create type sale_status as enum ('scheduled', 'completed', 'delivered', 'canceled');
create type payment_method as enum ('cash', 'card', 'pix', 'credit', 'other');
create type sale_channel as enum ('store', 'fair', 'delivery', 'resale', 'other');

create table sales (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  user_id uuid not null references auth.users(id),
  total numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  payment_method payment_method not null default 'cash',
  channel sale_channel not null default 'store',
  status sale_status not null default 'completed',
  scheduled_for timestamptz,
  notes text,
  created_at timestamptz not null default now()
);
create index on sales(company_id);
create index on sales(created_at desc);
create index on sales(scheduled_for) where scheduled_for is not null;

-- =====================================================
-- sale_items
-- =====================================================
create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  variant_id uuid not null references product_variants(id) on delete restrict,
  batch_id uuid references batches(id) on delete set null,
  quantity numeric(12,3) not null,
  unit_price numeric(12,2) not null,
  subtotal numeric(12,2) not null
);
create index on sale_items(sale_id);

-- =====================================================
-- reminders
-- =====================================================
create type reminder_status as enum ('pending', 'sent', 'canceled', 'failed');

create table reminders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  sale_id uuid references sales(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  title text not null,
  body text,
  remind_at timestamptz not null,
  status reminder_status not null default 'pending',
  sent_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);
create index on reminders(company_id);
create index on reminders(remind_at) where status = 'pending';
create index on reminders(sale_id);

create table reminder_recipients (
  reminder_id uuid not null references reminders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (reminder_id, user_id)
);

-- =====================================================
-- Triggers
-- =====================================================
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger trg_products_updated   before update on products
  for each row execute function set_updated_at();
create trigger trg_variants_updated   before update on product_variants
  for each row execute function set_updated_at();
create trigger trg_customers_updated  before update on customers
  for each row execute function set_updated_at();
create trigger trg_suppliers_updated  before update on suppliers
  for each row execute function set_updated_at();

create or replace function apply_stock_movement() returns trigger as $$
begin
  if new.type = 'in' then
    update product_variants set stock_quantity = stock_quantity + new.quantity
    where id = new.variant_id;
  elsif new.type in ('out', 'sale') then
    update product_variants set stock_quantity = stock_quantity - new.quantity
    where id = new.variant_id;
  elsif new.type = 'adjust' then
    update product_variants set stock_quantity = new.quantity
    where id = new.variant_id;
  end if;
  return new;
end; $$ language plpgsql;

create trigger trg_apply_stock after insert on stock_movements
  for each row execute function apply_stock_movement();

create or replace function create_sale_movement() returns trigger as $$
declare v_company uuid; v_user uuid; v_status sale_status;
begin
  select company_id, user_id, status into v_company, v_user, v_status
  from sales where id = new.sale_id;
  if v_status in ('scheduled','canceled') then return new; end if;
  insert into stock_movements
    (company_id, variant_id, batch_id, type, quantity, reference_type, reference_id, user_id)
  values
    (v_company, new.variant_id, new.batch_id, 'sale', new.quantity, 'sale', new.sale_id, v_user);
  return new;
end; $$ language plpgsql;

create trigger trg_sale_item_movement after insert on sale_items
  for each row execute function create_sale_movement();

create or replace function on_sale_status_change() returns trigger as $$
begin
  if old.status = 'scheduled' and new.status in ('completed','delivered') then
    insert into stock_movements
      (company_id, variant_id, batch_id, type, quantity, reference_type, reference_id, user_id)
    select new.company_id, si.variant_id, si.batch_id, 'sale', si.quantity, 'sale', new.id, new.user_id
    from sale_items si where si.sale_id = new.id;
  end if;
  return new;
end; $$ language plpgsql;

create trigger trg_sale_status_change after update of status on sales
  for each row execute function on_sale_status_change();

-- =====================================================
-- RLS
-- =====================================================
alter table companies            enable row level security;
alter table profiles             enable row level security;
alter table device_tokens        enable row level security;
alter table categories           enable row level security;
alter table products             enable row level security;
alter table product_variants     enable row level security;
alter table batches              enable row level security;
alter table suppliers            enable row level security;
alter table customers            enable row level security;
alter table stock_movements      enable row level security;
alter table sales                enable row level security;
alter table sale_items           enable row level security;
alter table reminders            enable row level security;
alter table reminder_recipients  enable row level security;

create or replace function current_company_id() returns uuid
language sql stable security definer as $$
  select company_id from profiles where id = auth.uid()
$$;

create policy "own_company_all" on categories       for all using (company_id = current_company_id());
create policy "own_company_all" on products         for all using (company_id = current_company_id());
create policy "own_company_all" on product_variants for all using (company_id = current_company_id());
create policy "own_company_all" on batches          for all using (company_id = current_company_id());
create policy "own_company_all" on suppliers        for all using (company_id = current_company_id());
create policy "own_company_all" on customers        for all using (company_id = current_company_id());
create policy "own_company_all" on stock_movements  for all using (company_id = current_company_id());
create policy "own_company_all" on sales            for all using (company_id = current_company_id());
create policy "own_company_all" on reminders        for all using (company_id = current_company_id());

create policy "own_company_companies" on companies for all using (id = current_company_id());
create policy "own_profile_select"    on profiles  for select using (company_id = current_company_id());
create policy "own_profile_update"    on profiles  for update using (id = auth.uid());

create policy "own_company_sale_items" on sale_items for all using (
  exists (select 1 from sales s where s.id = sale_id and s.company_id = current_company_id())
);
create policy "own_company_reminder_recipients" on reminder_recipients for all using (
  exists (select 1 from reminders r where r.id = reminder_id and r.company_id = current_company_id())
);
create policy "own_device_tokens" on device_tokens for all using (user_id = auth.uid());
```

---

## 5. Sistema de notificações

### Registro do device
1. App autenticado → `useNotifications()` solicita permissão.
2. Obtém `ExponentPushToken[...]`.
3. **Upsert** em `device_tokens` (user_id, company_id, token, platform).
4. Atualiza `last_seen_at` em cada cold start.

### Disparo
- `pg_cron` a cada minuto chama Edge Function `dispatch-reminders`.
- A função:
  1. RPC `pick_due_reminders` faz `SELECT ... FOR UPDATE SKIP LOCKED` em `reminders` pendentes com `remind_at <= now()`.
  2. Para cada lembrete, busca tokens dos destinatários.
  3. Envia em lote para `https://exp.host/--/api/v2/push/send` (até 100/request).
  4. Marca como `sent` ou `failed`.

### Edge Function `dispatch-reminders` — esqueleto

```ts
// supabase/functions/dispatch-reminders/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const auth = req.headers.get("Authorization") ?? "";
  if (auth !== `Bearer ${Deno.env.get("FUNCTIONS_SHARED_SECRET")}`) {
    return new Response("unauthorized", { status: 401 });
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: due } = await supabase.rpc("pick_due_reminders", { p_limit: 100 });
  if (!due?.length) return new Response("no-op");

  const messages = [];
  for (const r of due) {
    const { data: tokens } = await supabase
      .from("device_tokens").select("expo_push_token").in("user_id", r.recipient_ids);
    for (const t of tokens ?? []) {
      messages.push({
        to: t.expo_push_token, title: r.title,
        body: r.body ?? r.generated_body,
        data: { reminder_id: r.id, sale_id: r.sale_id },
        sound: "default",
      });
    }
  }

  for (let i = 0; i < messages.length; i += 100) {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(messages.slice(i, i + 100)),
    });
  }

  await supabase.from("reminders")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .in("id", due.map((d: any) => d.id));

  return new Response("ok");
});
```

### Cron

```sql
select cron.schedule(
  'dispatch-reminders-every-minute', '* * * * *',
  $$
    select net.http_post(
      url := 'https://<project>.functions.supabase.co/dispatch-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.functions_secret')
      )
    );
  $$
);
```

### Recepção
- Foreground → `Toast` (RNR), seguindo cores definidas no `DESIGN.md` §5.7.
- Background/quitado → notificação nativa.
- Tap → deep link pra `SaleDetail` (se houver `sale_id`) ou tela do lembrete.

---

## 6. Camada de services (contratos)

Cada feature tem `models/<feature>Service.ts`. Erros como `ServiceError`.

### AuthService
- `signUpOwner(email, password, fullName, companyName)`
- `signUpMember(email, password, fullName, inviteCode)`
- `signInWithEmail`, `signInWithGoogle`, `signOut`, `getCurrentProfile`, `resetPassword`, `getInviteCode`

### ProductService / VariantService / CategoryService / BatchService
CRUD padrão. `VariantService.lowStockVariants()`.

### InventoryService
- `listMovements(filters)`
- `createEntry({ variantId, quantity, unitCost, supplierId?, batchId?, notes? })`
- `createExit({ variantId, quantity, notes })`
- `createAdjustment({ variantId, newQuantity, notes })`

### SalesService
- `createSale(input)` — RPC `create_sale`
- `createScheduledSale(input)` — com `scheduled_for`
- `markDelivered(saleId)` — dispara trigger que gera movimentos
- `listSales(filters)` — `onlyScheduled`, `status`, período
- `getSale(id)`
- `cancelSale(id)` — RPC `cancel_sale`

### CustomersService
- `listCustomers({ type?: 'final' | 'reseller' })`
- `getCustomer(id)`
- `createCustomer(input)` — `type` obrigatório; campos de revenda exigidos quando `type='reseller'`
- `updateCustomer(id, input)`
- `deactivateCustomer(id)`
- `priceForCustomer(variantId, customerId)` — aplica `reseller_price` ou desconto %

### SuppliersService — CRUD padrão.

### RemindersService
- `listReminders({ status?, upcoming?, saleId? })`
- `createReminder({ title, body?, remindAt, saleId?, recipientIds[] })`
- `updateReminder(id, patch)`
- `cancelReminder(id)`
- `getCompanyMembers()` — popula multi-select de destinatários

### NotificationsService
- `registerDeviceToken()`
- `unregisterDeviceToken()`

### ReportsService (RPCs SQL)
- `salesByPeriod(start, end)`
- `topVariants(start, end, limit)`
- `stockSummary()`
- `lowStockReport()`
- `salesByPaymentMethod(start, end)`
- `salesByChannel(start, end)`
- `salesByCustomerType(start, end)`

---

## 7. Telas

> Layouts visuais detalhados em `DESIGN.md` §8 (mockups).
> Aqui ficam apenas a estrutura de navegação e os fluxos.

### Stack não autenticado
Splash · Login · Cadastro (tabs "Criar empresa" / "Entrar com convite") · Esqueci senha.

### Stack autenticado (Bottom Tabs)
1. **Início** — vendas do dia/mês, ticket médio, estoque baixo, próximas vendas agendadas, próximos lembretes.
2. **Produtos** — lista → detalhe com variantes → movimentar estoque.
3. **Vendas** (central) — Nova venda (PDV), Histórico, Agendadas.
4. **Contatos** — Clientes (tabs Final / Revenda) e Fornecedores.
5. **Mais** — Relatórios, Lembretes, Categorias, Lotes, Perfil, Código de convite, Sair.

### Fluxos importantes

**PDV — nova venda**
1. Buscar variante (autocomplete).
2. Adicionar ao carrinho com qtd; opcional: lote.
3. Selecionar cliente. Se revenda, preço já vem ajustado.
4. Aplicar desconto.
5. Canal e forma de pagamento.
6. Toggle "Agendar venda" → escolher data/hora (`status='scheduled'`).
7. Se agendada, bloco "Criar lembrete" — sugere data igual à da entrega, escolhe destinatários.
8. Finalizar.

**Lembretes**
- Lista de pendentes ordenada por `remind_at`.
- Tap → detalhe com venda relacionada (se houver).
- "+" → cria lembrete avulso.

**Clientes**
- Tabs Final / Revenda.
- Form muda conforme tipo: revenda mostra `business_name`, CNPJ, `reseller_discount_percent`.

---

## 8. User stories

### Épico: Clientes
- Cadastrar clientes finais e de revenda separadamente.
- No PDV com cliente de revenda, preço aparece já com desconto.
- Relatório de vendas por tipo de cliente.

### Épico: Vendas agendadas
- Registrar venda futura sem dar baixa no estoque ainda.
- Marcar venda agendada como entregue → estoque cai automaticamente.

### Épico: Lembretes
- Criar lembrete avulso pra qualquer compromisso.
- Criar lembrete vinculado a venda agendada com 1 toque.
- Escolher quais membros recebem cada lembrete.
- Receber push notification com app fechado.
- Cancelar lembrete antes do envio.

---

## 9. Convenções de código

- **Nomes:** `camelCase` / `PascalCase` / `SCREAMING_SNAKE` para constantes.
- **Imports:** alias `@/`.
- **Erros:** `ServiceError` no Model; ViewModel converte; View renderiza `EmptyState` ou `Toast`.
- **Datas:** sempre `Date` no domínio; formatar só na View (`shared/lib/format.ts`).
- **Moeda:** sempre `number` em BRL no domínio; formatar `R$ X,XX` na View.
- **Peso/quantidade:** `numeric(12,3)` → `number`.
- **Async:** sempre `try/catch` no ViewModel.
- **Sem `any`.**
- **UI:** preferir RNR antes de criar do zero. Sem cor hardcoded — usar tokens do `DESIGN.md` via tema NativeWind.

---

## 10. Variáveis de ambiente

`.env`:
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_PROJECT_ID=
```

Secrets da Edge Function (`supabase secrets set`):
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
FUNCTIONS_SHARED_SECRET=
```

A `service_role` key **nunca** entra no app.

---

## 11. Roadmap por sprint

| Sprint | Entrega |
|---|---|
| 0 | Setup Expo+TS, NativeWind config com tokens do DESIGN.md, RNR init, navegação, client Supabase, schema SQL aplicado, RLS testada |
| 1 | Auth (login, signup owner/member, Google OAuth, recuperação, código de convite) |
| 2 | Categorias + Produtos + Variantes |
| 3 | Lotes + Movimentações + dashboard básico |
| 4 | Clientes (final/revenda) + Fornecedores |
| 5 | PDV — nova venda (`create_sale`) com preço por tipo de cliente |
| 6 | Vendas agendadas + histórico + cancelamento |
| 7 | Notificações: device_tokens, Edge Function, pg_cron |
| 8 | Lembretes: telas, criação avulsa e vinculada, recepção e deep link |
| 9 | Relatórios + gráficos |
| 10 | Polimento, ícone, splash, build EAS |

---

## 12. Como o Claude Code deve trabalhar neste repo

- **Antes de implementar qualquer tela**, consultar `DESIGN.md` §8 para o layout e §5 para componentes.
- **Antes de criar uma tela**, criar o ViewModel e o Service correspondentes.
- **Antes de criar um Service**, conferir se já existe método similar.
- **Antes de mexer no schema**, propor a migration SQL e esperar confirmação.
- **Sempre seguir MVVM.** Nunca lógica de negócio em View.
- **Não inventar campos** fora do schema. Se faltar algo, sinalizar e propor migration.
- **Sempre tipar** com base em `database.types.ts`.
- **Sem cor hardcoded** — usar tokens do `DESIGN.md` via tema NativeWind/Tailwind.
- **Para UI básica, tentar RNR primeiro.** Se faltar, rodar `npx @react-native-reusables/cli add <comp>`. Só compor por cima.
- **Para notificações**, qualquer mudança no fluxo passa por (1) tabela, (2) Edge Function, (3) cron. Não agendar pelo cliente.
- Ao terminar uma tarefa, listar arquivos criados/alterados e qualquer pendência ou suposição feita.

---

## 13. Próximos passos imediatos (Sprint 0)

1. `npx create-expo-app honey-stock --template default` (TS).
2. Instalar deps:
   ```
   npx expo install @supabase/supabase-js @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context expo-notifications expo-device expo-secure-store expo-auth-session expo-crypto
   npm i zustand @tanstack/react-query react-hook-form zod nativewind victory-native lucide-react-native
   ```
3. Inicializar NativeWind + RNR:
   ```
   npx @react-native-reusables/cli@latest init
   npx @react-native-reusables/cli@latest add button input label card dialog alert-dialog badge avatar checkbox switch select tabs toast skeleton separator
   ```
4. **Configurar `tailwind.config.js` com os tokens do `DESIGN.md` §2 e §4** (cores honey/wood/ink, espaçamentos, radius).
5. Configurar alias `@/`, ESLint, Prettier.
6. Criar projeto Supabase, rodar o SQL da seção 4.
7. Habilitar `pg_cron` e `pg_net` (Database → Extensions).
8. Gerar tipos: `npx supabase gen types typescript --project-id <id> > src/shared/types/database.types.ts`.
9. Implementar `shared/lib/supabase.ts` e `shared/hooks/useAuth.ts`.
10. Implementar `shared/hooks/useNotifications.ts`.
11. Deploy da Edge Function `dispatch-reminders` (placeholder) e agendamento do cron.
12. Sprint 1 ponta a ponta.