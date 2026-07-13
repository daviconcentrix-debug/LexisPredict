# ⚖️ LexisPredict / W1 Capital — Advanced Legal Ops

**Gabinete Jurídico de Alta Performance**  
Sistema completo de CRM jurídico + Gerador de Procurações + Dossiê Forense + Analytics de Prazos.

> Versão Elite v14000+ • Arquitetura Serverless + Local-First + IA Híbrida (Grok 4.5 + DeepSeek V3)  
> Especializado em contratos de assessoria financeira (Get Assessoria) e processos com numeração CNJ.

---

## 🚀 Visão Geral

O **LexisPredict** (também conhecido como **W1 Capital Advanced Legal Ops**) é um CRM jurídico moderno construído em Next.js 15 que substitui planilhas Excel e fluxos manuais por um gabinete digital inteligente.

Principais objetivos:
- Importar e processar milhares de processos a partir de planilhas CSV/Excel
- Calcular automaticamente status de prazos (Vencido / Atenção / No Prazo / Arquivado)
- Identificar tribunal pelo número CNJ
- Extrair dados de contratos PDF (especialmente Get Assessoria Financeira) com IA + Regex de resgate
- Gerar **Procurações** profissionais em PDF (padrão ABNT)
- Produzir **Master Report / Dossiê Forense** com KPIs, casos críticos e evidências
- Customização total de tema (cores, wallpaper, contraste AAA)
- Funcionamento offline / localStorage como fallback robusto

O sistema foi projetado para **nunca travar**: se a IA falhar, o operador preenche manualmente. Se o Firebase/Supabase estiver instável, o modo local assume imediatamente.

---

## ✨ Features Principais

### 1. Gestão de Processos (Case Management)
- Listagem em tempo real com filtros e busca
- Status automático de prazo baseado em data
- Identificação de Tribunal (TJSP, TRF1, TJMG, etc.) via regex CNJ
- Links diretos para consulta pública dos tribunais
- Cadastro manual + edição completa
- Notas e evidências anexas por caso

### 2. Ferramenta de Migração (Migration Tool)
- Upload de CSV / Excel
- Mapeamento inteligente de colunas (português e inglês)
- Motor lógico `processarCaso()` que:
  - Limpa protocolo CNJ
  - Detecta tribunal
  - Calcula dias restantes e status
- Progresso real + gravação em batch ou individual
- Modo localStorage (funciona mesmo sem backend)

### 3. Gerador de Procurações Elite (Documents)
- Drag & drop de PDF de contratos
- Transcrição server-side com `pdf-parse`
- Extração neural híbrida:
  1. Grok 4.5 (xAI) — primário
  2. DeepSeek V3 (Airforce) — fallback
  3. **Regex de Resgate** — última linha de defesa
- Formulário de revisão forense (Step 2) com todos os campos:
  - Nome, Data de Nascimento (manual), RG, CPF
  - Email, Telefone, Endereço, CEP
  - Profissão, Estado Civil
  - Dados do processo: Banco, CNPJ do Banco, Valores, Número CNJ
- Geração de PDF profissional via `@react-pdf/renderer` (Base64)
- Seleção de advogado da banca + OAB por estado

### 4. Master Report / Dossiê Forense (`/report`)
- KPIs: Total sob gestão, Alertas Críticos, Em Atenção, Saudáveis
- Tabela de Triagem de Casos Críticos
- Distribuição por Tribunal (barras)
- Log de Evidências & Notas
- Parecer complementar do auditor
- Exportação PDF forense com fidelidade cromática (sem grayscale)
- Layout print-ready (A4)

### 5. Configurações & Hardware Visual
- Seletor de idioma (pt-BR / en-US) com persistência
- Customização completa de tema:
  - Cor primária, fundo, texto
  - Wallpaper (URL)
  - Opacidade / brilho
- Persistência via `localStorage` + CSS variables injetadas no root
- Contraste AAA garantido

### 6. Motor de Análise de Risco (Urgency Engine)
- Regras de pontuação (prazo vencido, dados faltantes, etc.)
- Score de risco e prioridade
- Integração com DeepSeek para parecer técnico (quando configurado)

---

## 🛠 Tech Stack

| Camada              | Tecnologia                          |
|---------------------|-------------------------------------|
| Frontend            | Next.js 15 (App Router) + TypeScript |
| Estilização         | Tailwind CSS + shadcn/ui + Lucide React |
| Estado / Persistência | localStorage + Server Actions     |
| PDF Parsing         | pdf-parse (server-side)             |
| PDF Generation      | @react-pdf/renderer                 |
| IA Primária         | xAI Grok 4.5                        |
| IA Fallback         | DeepSeek V3                         |
| Extração Resiliente | Regex + Few-shot Prompt + Polimorfismo JSON |
| Auth                | Custom Auth Provider (multi-tenant) |
| Backend (opcional)  | Firebase Firestore / Supabase (com modo offline) |

**Importante:** O projeto foi desenhado para **não depender** de Gemini e para funcionar mesmo com Firebase instável (modo local-first).

---

## 📁 Estrutura de Pastas (resumo)

```
src/
├── app/
│   ├── actions/
│   │   ├── case-actions.ts          # CRUD de processos e notas
│   │   └── document-actions.ts      # Extração + geração de procuração
│   ├── dashboard/                   # Páginas do CRM
│   │   ├── cases/
│   │   ├── import/                  # Migration Tool
│   │   ├── documents/               # Gerador de Procurações
│   │   └── settings/                # Tema + Idioma + Sistema
│   ├── report/page.tsx              # Master Report / Dossiê
│   └── layout.tsx                   # Theme injection + providers
├── components/
│   ├── ui/                          # shadcn components
│   ├── auth/
│   └── ...
├── lib/
│   ├── case-logic.ts                # processarCaso, status, CNJ
│   ├── theme.ts                     # applyGlobalTheme
│   └── utils.ts                     # cn()
└── ...
```

---

## ⚙️ Como rodar localmente

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/lexispredict.git
cd lexispredict

# 2. Instale as dependências
npm install
# ou
pnpm install

# 3. Configure as variáveis de ambiente (opcional)
cp .env.example .env.local
```

```env
# .env.local (exemplos)
XAI_API_KEY=sua_chave_xai
DEEPSEEK_API_KEY=sua_chave_deepseek
# Firebase / Supabase se quiser usar (o app funciona sem)
```

```bash
# 4. Rode em desenvolvimento
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

> O app inicia em **modo local** (localStorage). Os dados persistem no navegador até você limpar.

---

## 🧠 Fluxo do Gerador de Procurações (o coração do sistema)

1. Usuário arrasta PDF do contrato (Get Assessoria ou similar)
2. Server Action extrai texto com `pdf-parse`
3. Texto passa por **limpeza agressiva** (`limparTextoContrato`)
4. Cascata de IA:
   - Grok 4.5 com SYSTEM_PROMPT especializado em campos colados
   - Fallback DeepSeek
5. Se a IA falhar → **Regex de Resgate** captura Nome, CPF, RG, Data, Email, Telefone, Banco...
6. Formulário de Revisão (Step 2) abre com dados preenchidos (ou vazios para edição manual)
7. Operador valida / corrige (Data de Nascimento é sempre manual)
8. Gera PDF da Procuração via `@react-pdf/renderer` e faz download em Base64

---

## 🎨 Customização de Tema

Na aba **System → Configurações** você pode:
- Trocar idioma (🇧🇷 / 🇺🇸)
- Definir cores primária / fundo / texto
- Colocar wallpaper de fundo
- Ajustar contraste

As preferências são salvas no `localStorage` e aplicadas via CSS variables no `<html>`.

---

## 📊 Master Report

Acesse `/report` ou clique em **Access PDF Analytics**.

- Compila todos os casos e notas do repositório
- Calcula KPIs em tempo real
- Gera dossiê forense pronto para impressão / PDF
- Imagens de evidência mantêm cores (sem grayscale)

---

## 🛡️ Princípios de Design (W1 Capital)

- **Nunca trave o operador** — Fail-safe para IA e backend
- **Local-first** — Funciona offline
- **Soberania de IA** — Sem Gemini (conforme diretriz do cliente)
- **Fidelidade jurídica** — Campos críticos (data nascimento, CNPJ banco, etc.) sempre editáveis
- **Contraste AAA** + tipografia profissional (Space Grotesk + Inter)
- **Print-ready** em todos os documentos oficiais

---

## 📌 Observações Importantes

- O sistema foi desenvolvido iterativamente em ambiente Firebase Studio / Google Cloud Workstations.
- Muitas versões intermediárias usavam Firebase Firestore, mas o modo final prioritário é **localStorage + Server Actions**.
- A extração de contratos Get Assessoria é o caso de uso mais otimizado (campos colados, OCR sujo).
- Chaves de API (xAI / DeepSeek) devem ser configuradas no servidor. Nunca expostas no client.

---

## 🤝 Contribuição / Próximos Passos

Possíveis melhorias futuras:
- [ ] Integração real e estável com Supabase (já testada parcialmente)
- [ ] Cloud Functions para scoring automático de risco
- [ ] Multi-tenant completo com RLS
- [ ] Exportação em lote de procurações
- [ ] Webhook de notificação de prazos

---

## 📄 Licença

Proprietário — W1 Capital / Davi Alves Figueredo  
Uso interno do gabinete. Todos os direitos reservados.

---

**LexisPredict** — De planilha caótica para gabinete de elite.  
*Built with precision. Powered by resilience.*

---

### Créditos Técnicos
- Arquitetura e prompts de extração: otimizados para contratos brasileiros de financiamento
- Motor de CNJ e links de tribunais: mapeamento completo TJ + TRF
- UI/UX: inspirado em dashboards de alta densidade (legal ops)

Se precisar de ajuda para deploy (Vercel + Server Actions), configuração de chaves ou extensão de campos, abra uma issue.