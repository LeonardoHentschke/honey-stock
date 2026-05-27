# Design System — App Mel

Guia visual e de design para o app de controle de estoque e vendas de mel. Este documento é a **fonte única de verdade visual** — qualquer tela ou componente novo deve seguir os tokens e padrões aqui descritos.

Complementa o `CLAUDE.md` (que cobre arquitetura técnica). Quando houver conflito entre os dois, este documento manda em decisões visuais; `CLAUDE.md` manda em decisões técnicas.

---

## 1. Princípios

1. **Calmo e natural.** O app trabalha com produto artesanal; a interface não deve parecer um sistema corporativo. Tons quentes, espaçamento generoso, tipografia legível.
2. **Eficiência no PDV.** A tela de venda é a mais usada — precisa ser rápida, com alvos grandes (mínimo 48dp) e poucos passos.
3. **Hierarquia clara.** Cada tela tem um objetivo único. Ações primárias destacadas, secundárias contidas.
4. **Dados como protagonistas.** Cards de dashboard e listas usam tipografia grande pros números; rótulos pequenos e suaves.
5. **Erros amigáveis.** Mensagens humanas, nunca técnicas. "Esse produto já existe" em vez de "duplicate key violation".

---

## 2. Paleta de cores

Direção: **mel e natural**. Âmbar como cor principal, madeira como apoio, neutros quentes (não cinza azulado).

### Tokens base

```
--honey-50:   #FEF9EC   (background sutil, hover de card)
--honey-100:  #FCEFC8   (background de destaque suave)
--honey-200:  #F9DE91
--honey-300:  #F5C859   (botões secundários, badges)
--honey-400:  #F0B12C
--honey-500:  #E89B12   ★ cor primária — botões, ações, links
--honey-600:  #C47C0A
--honey-700:  #9B5F0B
--honey-800:  #7A4A0F
--honey-900:  #5A3708

--wood-50:    #FAF6F1
--wood-100:  #F2E8D9
--wood-200:  #E3D0AE
--wood-300:  #C9AC75
--wood-400:  #A8854A
--wood-500:  #7A5A2A   (texto secundário em fundos claros)

--ink-900:   #1F1B16   ★ texto principal
--ink-700:   #3B342B   (texto em cards)
--ink-500:   #6B6258   (texto secundário, labels)
--ink-300:   #A89E91   (placeholder, disabled)
--ink-100:   #E7E2D9   (borders, dividers)
--ink-50:    #F5F1EA   (background app)

--white:     #FFFFFF

--success:   #2E7D32
--warning:   #C77700
--danger:    #B3261E
--info:      #1565C0
```

### Aplicação

| Uso | Token |
|---|---|
| Background do app | `--ink-50` |
| Card / superfície elevada | `--white` |
| Texto principal | `--ink-900` |
| Texto secundário | `--ink-500` |
| Borda / divisor | `--ink-100` |
| Botão primário (fill) | `--honey-500` |
| Botão primário (texto) | `--white` |
| Botão secundário (fill) | `--honey-100` |
| Botão secundário (texto) | `--honey-700` |
| Botão fantasma (texto) | `--honey-600` |
| Link | `--honey-600` |
| Foco / outline | `--honey-400` (2px) |
| Badge "revenda" | `--wood-200` bg / `--wood-500` text |
| Badge "agendada" | `--info` bg-tint / `--info` text |
| Badge "estoque baixo" | `--warning` bg-tint / `--warning` text |
| Erro inline | `--danger` |
| Sucesso (toast/check) | `--success` |

### Modo escuro
**Não no MVP.** Estrutura de tokens já permite adicionar depois — só duplicar a paleta com `--ink-*` invertido.

---

## 3. Tipografia

**Família:** `Inter` (web/RNW) ou system stack no nativo (`-apple-system, Segoe UI, Roboto, sans-serif`). Em RN, usar `Inter` via `@expo-google-fonts/inter` com fallback.

### Escala

| Token | Tamanho | Peso | Uso |
|---|---|---|---|
| `display` | 32 / 40 lh | 700 | Números do dashboard |
| `h1` | 24 / 32 lh | 700 | Título de tela |
| `h2` | 20 / 28 lh | 600 | Título de seção / card destacado |
| `h3` | 17 / 24 lh | 600 | Subtítulos |
| `body` | 15 / 22 lh | 400 | Texto padrão |
| `body-strong` | 15 / 22 lh | 600 | Ênfase inline |
| `label` | 13 / 18 lh | 500 | Labels de formulário, metadados |
| `caption` | 12 / 16 lh | 400 | Auxiliar, footnote |
| `mono` | 14 / 20 lh | 500 | SKU, código de convite, lote |

### Regras

- Nunca passar de 3 tamanhos diferentes em uma mesma tela.
- Números importantes (totais, qtd em estoque, R$) sempre **tabular-nums** pra alinhar.
- SKU, código de lote, código de convite → `font-family: ui-monospace` (ou `Inter` com `font-variant-numeric: tabular-nums`).

---

## 4. Espaçamento e raio

Sistema baseado em **4px**.

```
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px   ★ padrão de padding interno
--space-5: 20px
--space-6: 24px   ★ padding de tela / gaps de seção
--space-8: 32px
--space-10: 40px
--space-12: 48px

--radius-sm: 6px   (badges, inputs internos)
--radius-md: 10px  ★ inputs, botões
--radius-lg: 14px  ★ cards
--radius-xl: 20px  (modais, bottom sheets)
--radius-full: 9999px (avatar, chips)
```

### Sombra

```
--shadow-sm: 0 1px 2px rgba(31, 27, 22, 0.06)
--shadow-md: 0 4px 12px rgba(31, 27, 22, 0.08)   ★ cards
--shadow-lg: 0 12px 32px rgba(31, 27, 22, 0.12)  (modais)
```

---

## 5. Componentes (alinhados ao React Native Reusables)

Quando aplicável, mapeio o token do design ao componente RNR (`components/ui/...`).

### 5.1 Button

| Variante | Visual | RNR |
|---|---|---|
| Primary | bg `--honey-500`, text `--white`, altura 48dp, radius `md` | `Button` (default) |
| Secondary | bg `--honey-100`, text `--honey-700` | `Button variant="secondary"` |
| Ghost | bg transparente, text `--honey-600`, hover bg `--honey-50` | `Button variant="ghost"` |
| Destructive | bg `--danger`, text `--white` | `Button variant="destructive"` |
| Outline | borda `--ink-100`, text `--ink-900` | `Button variant="outline"` |

Tamanhos: `sm` (36dp), `md` (44dp, padrão), `lg` (52dp). Botão de "Finalizar venda" no PDV → **`lg` + full width**.

### 5.2 Input

- Altura 48dp, padding horizontal 16dp.
- Border `--ink-100` (1px); focus `--honey-400` (2px).
- Label acima (`label` token), erro abaixo em `--danger`.
- Placeholder em `--ink-300`.
- RNR: `Input` + `Label` + helper inline.

### 5.3 Card

- bg `--white`, radius `lg`, padding `--space-4`, sombra `--shadow-md`.
- Lista de produtos / vendas → card com `gap` 12px entre cards.
- RNR: `Card` (composição `CardHeader`, `CardContent`, `CardFooter`).

### 5.4 Badge

- Padding 4×10, radius `full`, `caption` font.
- Variantes pré-definidas no app:
  - `final` → bg `--honey-100`, text `--honey-700` ("Final")
  - `reseller` → bg `--wood-200`, text `--wood-500` ("Revenda")
  - `scheduled` → bg azul tint, text `--info` ("Agendada")
  - `delivered` → bg verde tint, text `--success` ("Entregue")
  - `canceled` → bg cinza, text `--ink-500` ("Cancelada")
  - `low-stock` → bg laranja tint, text `--warning` ("Estoque baixo")
- RNR: `Badge` com variants customizados.

### 5.5 Tabs

- Underline em `--honey-500` na ativa; inativa em `--ink-500`.
- Usado em: lista de clientes (Final / Revenda), histórico vs agendadas em Vendas.
- RNR: `Tabs`.

### 5.6 Dialog / Bottom Sheet

- Em mobile, **bottom sheet** é preferido sobre dialog central para formulários longos (novo cliente, novo produto, novo lembrete).
- Bottom sheet: radius `xl` no topo, drag handle de 36×4 em `--ink-100`.
- Dialog central só para confirmações curtas (cancelar venda, excluir).
- RNR: `Dialog` para central; combinar com bottom sheet customizado para formulários.

### 5.7 Toast

- Aparece no topo (não cobre o teclado mobile).
- Cores por tipo: `success` `--success`, `error` `--danger`, `info` `--info`.
- RNR: `Toast`.

### 5.8 Empty state

- Ilustração simples (ícone `lucide` 64×64 em `--honey-300`) + título + ação primária.
- Aplicado em: lista vazia de produtos, vendas, lembretes.

### 5.9 Skeleton

- bg `--honey-50` com shimmer suave.
- Usado em todas as listas durante o `isLoading` do React Query.
- RNR: `Skeleton`.

---

## 6. Padrões de tela

### 6.1 Estrutura padrão

```
┌─────────────────────────────────┐
│ Header (h1 + ação contextual)   │ 56dp
├─────────────────────────────────┤
│ Conteúdo (scroll)               │
│   padding horizontal: 24dp      │
│   padding top: 16dp             │
│                                 │
│                                 │
├─────────────────────────────────┤
│ Bottom Tabs (5 tabs)            │ 64dp + safe area
└─────────────────────────────────┘
```

### 6.2 Bottom Tabs

- 5 tabs: Início · Produtos · **Vendas (central, destacada)** · Contatos · Mais.
- Ícones `lucide-react-native`: `Home`, `Package`, `ShoppingCart`, `Users`, `MoreHorizontal`.
- Tab "Vendas" no centro com botão flutuante elevado (`--honey-500`, radius `full`, sombra `lg`) — acessa "Nova venda" direto.
- Ativa: ícone + label em `--honey-600`. Inativa: `--ink-500`.

### 6.3 Header

- Título h1 + (à direita) ícone de ação primária quando aplicável (ex: `+` para criar).
- Telas de detalhe têm botão de voltar (`<`) à esquerda.

### 6.4 Listas

- Cards com `gap` 12dp.
- Pull-to-refresh em todas as listas principais.
- Busca como input fixo abaixo do header em listas grandes (produtos, vendas, clientes).

### 6.5 Formulários

- Sempre em bottom sheet (ou full screen modal em forms longos).
- Botão primário **sticky no rodapé** com safe area.
- Validação inline ao perder foco; erros não bloqueiam digitação.
- Campos opcionais marcados como `(opcional)` no label.

### 6.6 PDV — carrinho

- Lista de itens com swipe-to-delete.
- Stepper de quantidade `[ − ] N [ + ]`, com alvos 44dp.
- Total fixo no rodapé com botão "Finalizar venda" em `--honey-500`, `lg`, full width.

---

## 7. Iconografia

Biblioteca: **lucide-react-native** (padrão do RNR).

| Conceito | Ícone |
|---|---|
| Início | `Home` |
| Produtos | `Package` |
| Variantes | `Boxes` |
| Estoque | `Warehouse` |
| Entrada | `ArrowDownToLine` |
| Saída | `ArrowUpFromLine` |
| Ajuste | `Settings2` |
| Vendas | `ShoppingCart` |
| Nova venda | `Plus` |
| Cliente final | `User` |
| Revenda | `Store` |
| Fornecedor | `Truck` |
| Lote | `Tags` |
| Lembrete | `Bell` |
| Notificação | `BellRing` |
| Agendada | `CalendarClock` |
| Entregue | `CheckCircle2` |
| Cancelado | `XCircle` |
| Relatório | `BarChart3` |
| Configurações | `Settings` |
| Sair | `LogOut` |
| Buscar | `Search` |
| Filtrar | `SlidersHorizontal` |
| Compartilhar | `Share2` |

Tamanho padrão: 20px em listas, 24px em headers, 16px em badges/labels.

---

## 8. Mockups das telas principais

Esta seção descreve em prosa estruturada o layout de cada tela. Para gerar os mockups visuais reais (HTML/SVG renderizado), use prompts no Claude do tipo: **"Gere o mockup HTML da tela X seguindo o DESIGN.md"** — o sistema acima é suficiente pra que qualquer tela seja gerada de forma consistente.

### 8.1 Login

```
┌─────────────────────────────────┐
│                                 │
│         🍯  (ícone 96dp)        │
│                                 │
│         Mel Manager             │  ← h1
│         Controle simples        │  ← body, --ink-500
│                                 │
│   ┌─────────────────────────┐   │
│   │ Email                   │   │
│   ├─────────────────────────┤   │
│   │ Senha             [👁]  │   │
│   └─────────────────────────┘   │
│                                 │
│   [    Entrar    ]              │  ← primary, full
│                                 │
│   ─── ou ───                    │
│                                 │
│   [  G  Continuar com Google ]  │  ← outline, full
│                                 │
│   Esqueci minha senha           │  ← ghost, center
│                                 │
│   ────────────────────          │
│   Não tem conta? Cadastre-se    │
└─────────────────────────────────┘
```

### 8.2 Dashboard (Início)

```
┌─────────────────────────────────┐
│ Olá, [Nome] 👋          [🔔 3] │
├─────────────────────────────────┤
│                                 │
│ ┌─────────────┐ ┌─────────────┐│
│ │ Vendas hoje │ │ Vendas mês  ││  ← Card duplo
│ │ R$ 240,00   │ │ R$ 4.180,00 ││  ← display
│ │ 8 vendas    │ │ 142 vendas  ││  ← caption
│ └─────────────┘ └─────────────┘│
│                                 │
│ ⚠ Estoque baixo (3)             │  ← h3
│ ┌─────────────────────────────┐ │
│ │ Mel silvestre 500g          │ │
│ │ Restam 2 un · mín 5         │ │  ← caption
│ └─────────────────────────────┘ │
│ [+ 2 itens]                     │
│                                 │
│ 📅 Próximas vendas agendadas    │
│ ┌─────────────────────────────┐ │
│ │ Hoje 16h · Maria Padaria    │ │
│ │ 12 potes silvestre 500g     │ │
│ │ R$ 360,00          [Entregar]│ │
│ └─────────────────────────────┘ │
│                                 │
│ 🔔 Lembretes pendentes (2)      │
│ ┌─────────────────────────────┐ │
│ │ Cobrança João · amanhã 09h  │ │
│ └─────────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│ 🏠   📦   ➕   👥   ⋯           │  ← Bottom Tabs
└─────────────────────────────────┘
```

### 8.3 Produtos — Lista

```
┌─────────────────────────────────┐
│ ← Produtos              [ + ]   │
├─────────────────────────────────┤
│ 🔍 Buscar produto...            │
│ [ Todas ▾ ] [ Estoque baixo ]   │  ← chips filtro
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ Mel silvestre               │ │  ← h3
│ │ 3 variantes                 │ │  ← caption
│ │ ──────────────────          │ │
│ │ 500g pote vidro · R$ 30,00  │ │
│ │ Estoque: 24 un              │ │
│ │ ──────────────────          │ │
│ │ 1kg pote vidro · R$ 55,00   │ │
│ │ Estoque: 12 un              │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Mel de eucalipto            │ │
│ │ 2 variantes  [Estoque baixo]│ │  ← badge warning
│ │ ...                         │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### 8.4 Nova venda (PDV)

```
┌─────────────────────────────────┐
│ ← Nova venda                    │
├─────────────────────────────────┤
│ 🔍 Adicionar produto...    [📷] │  ← câmera futura
├─────────────────────────────────┤
│ Carrinho (3 itens)              │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Mel silvestre 500g          │ │
│ │ R$ 30,00 cada               │ │
│ │ [ − ]   2   [ + ]   R$60,00 │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Mel eucalipto 1kg           │ │
│ │ R$ 50,00 (revenda −10%)     │ │  ← preço ajustado
│ │ [ − ]   5   [ + ]  R$250,00 │ │
│ └─────────────────────────────┘ │
│                                 │
│ ─────────────                   │
│ Cliente   [Maria Padaria 🏪] >  │  ← badge revenda
│ Canal     [Revenda ▾]           │
│ Pagamento [PIX ▾]               │
│ Desconto  [R$ 0,00]             │
│                                 │
│ Agendar venda?         [ OFF ]  │  ← switch
│                                 │
├─────────────────────────────────┤
│ Total              R$ 310,00    │  ← display
│ [    Finalizar venda    ]       │  ← primary lg
└─────────────────────────────────┘
```

Quando `Agendar venda` está **ON**, aparece:

```
│ ─────────────                   │
│ Entregar em                     │
│ [📅 25/05 às 14:00]             │
│                                 │
│ Criar lembrete?         [ ON ]  │
│ Avisar em                       │
│ [📅 25/05 às 12:00]             │
│ Para:                           │
│ [✓ Eu] [✓ João] [ ] Ana         │
```

### 8.5 Clientes — Lista (com tabs)

```
┌─────────────────────────────────┐
│ Clientes                [ + ]   │
├─────────────────────────────────┤
│ [ Final ]  [ Revenda ]          │  ← Tabs
├─────────────────────────────────┤
│ 🔍 Buscar cliente...            │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 🏪 Maria Padaria            │ │
│ │ Padaria da Maria LTDA       │ │  ← business_name
│ │ CNPJ 12.345.678/0001-90     │ │
│ │ Desconto: 10%   [Revenda]   │ │  ← badge
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🏪 Mercado Central          │ │
│ │ Desconto: 15%   [Revenda]   │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

Form de novo cliente (bottom sheet):

```
┌─────────────────────────────────┐
│         ───                     │  ← drag handle
│ Novo cliente                    │
├─────────────────────────────────┤
│ Tipo                            │
│ [ Final ◯ ]  [ Revenda ● ]      │  ← segmented
│                                 │
│ Nome do contato *               │
│ [ João Silva                  ] │
│                                 │
│ Razão social *                  │  ← só aparece p/ revenda
│ [ Mercado Silva LTDA          ] │
│                                 │
│ CNPJ *                          │
│ [ __.___.___/____-__          ] │
│                                 │
│ Desconto padrão (%)             │
│ [ 15                          ] │
│                                 │
│ Telefone                        │
│ [ (51) 9____-____             ] │
│                                 │
│ Endereço                        │
│ [                             ] │
│                                 │
│ [        Salvar cliente       ] │  ← primary
└─────────────────────────────────┘
```

### 8.6 Lembretes — Lista

```
┌─────────────────────────────────┐
│ Lembretes               [ + ]   │
├─────────────────────────────────┤
│ [ Pendentes ] [ Enviados ]      │
├─────────────────────────────────┤
│ HOJE                            │  ← seção
│ ┌─────────────────────────────┐ │
│ │ 🔔 Cobrar Maria Padaria     │ │
│ │ Vinculado a venda #1234     │ │
│ │ Hoje 16:00 · em 2h          │ │
│ │ Para: você, João            │ │
│ └─────────────────────────────┘ │
│                                 │
│ AMANHÃ                          │
│ ┌─────────────────────────────┐ │
│ │ 🔔 Entregar pedido João     │ │
│ │ Vinculado a venda #1240     │ │
│ │ Amanhã 09:00                │ │
│ │ Para: você                  │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### 8.7 Notificação push (recepção)

```
┌─────────────────────────────────┐
│ 🍯 Mel Manager              agora│
│ Cobrar Maria Padaria            │  ← title
│ 12 potes silvestre 500g · R$360 │  ← body gerado
└─────────────────────────────────┘
```

---

## 9. Estados especiais

### Loading
- Skeleton em listas (3 a 5 cards).
- Botões em estado "loading" trocam texto por spinner + label opcional ("Salvando...").

### Empty
- Ícone 64dp em `--honey-300`.
- Título h3, descrição body em `--ink-500`.
- Ação primária quando aplicável ("Cadastrar primeiro produto").

### Erro
- Mensagem inline em forms (texto vermelho 13/18 abaixo do campo).
- Toast vermelho para erros de rede/servidor.
- Tela cheia de erro (ilustração + retry) só se a tela inteira falhou.

### Sem internet
- Banner persistente no topo (`--warning` bg, texto escuro): "Sem conexão · alguns dados podem estar desatualizados".

---

## 10. Acessibilidade

- Contraste mínimo 4.5:1 em todo texto. Validar `--honey-500` sobre branco — usar `--honey-700` para texto em link sobre fundo claro.
- Áreas tocáveis ≥ 44×44 dp.
- Labels associados aos inputs (RHF + RNR já trata isso).
- Suporte a screen reader: cards de lista lidos como "Produto Mel silvestre, 24 unidades em estoque, R$ 30,00".
- Suportar fonte do sistema aumentada (até 130%) sem quebrar layout.

---

## 11. Como gerar mockups com Claude

Fluxo recomendado:

1. **Ter este DESIGN.md em contexto.**
2. Pedir: *"Gere o mockup HTML mobile da tela [X] do app Mel Manager, seguindo o DESIGN.md. Use os tokens de cor e tipografia descritos. Tamanho 390×844px (iPhone)."*
3. Iterar visualmente até aprovar.
4. Quando aprovado, passar pro Claude Code junto com `CLAUDE.md` para implementação real em RN + RNR.

### Template de prompt sugerido

> Você é um designer trabalhando no app Mel Manager. Use o DESIGN.md em anexo como fonte da verdade visual.
>
> Gere um mockup HTML estático da tela **[NOME DA TELA]** descrita na seção 8.X do DESIGN.md.
>
> Requisitos:
> - Viewport 390×844px (frame de iPhone)
> - Use as cores, tipografia e raios do sistema
> - Ícones via Lucide (CDN: `https://unpkg.com/lucide-static/font/lucide.css`)
> - Fonte Inter via Google Fonts
> - Renderizar como um único HTML self-contained
> - Mostrar dados realistas de mel (não Lorem Ipsum)

---

## 12. Checklist antes de aprovar uma tela

- [ ] Usa apenas tokens do DESIGN.md (zero cor hardcoded fora deles)
- [ ] Tipografia respeita a escala (display/h1/h2/body/label)
- [ ] Espaçamentos múltiplos de 4
- [ ] Alvos tocáveis ≥ 44dp
- [ ] Estado vazio, loading e erro previstos
- [ ] Componentes mapeados pra RNR equivalentes
- [ ] Ícone Lucide identificado para cada ação
- [ ] Texto em português natural (sem "submit", "delete")
- [ ] Números com formatação BR (R$ 1.234,56 / 25/05/2026 14:30)
