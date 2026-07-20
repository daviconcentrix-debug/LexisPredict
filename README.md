# LexisPredict Elite

**Plataforma de Gestão Jurídica e Operacional**  
Desenvolvida internamente pela **W1 Capital / Get Assessoria Financeira Ltda.**

LexisPredict é um sistema completo de operações jurídicas com forte automação por IA, suporte offline-first e interface executiva altamente customizável.

## ✨ Principais Funcionalidades

- Extração inteligente de dados de contratos bancários via IA
- Geração automática de Procurações, Habilitações e Substabelecimentos
- Terminal WhatsApp completo com geração de mensagens por IA
- Gestão de prazos, riscos e distribuição por tribunal (CNJ)
- Dashboard com KPIs, alertas e relatórios
- Modo **offline-first** (funciona sem internet)
- Interface totalmente customizável (temas, wallpapers e visual executivo)
- Geração de Dossiê Forense consolidado em PDF

## 🛠️ Stack Tecnológica

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui
- **Supabase** (opcional) com suporte local-first
- **Genkit** + múltiplos provedores de IA (Grok, Groq, Airforce)
- **@react-pdf/renderer** + pdf-parse
- Zod, React Hook Form, Recharts, date-fns

## 🚀 Como Rodar o Projeto

```bash
npm install
npm run dev
```
Acesse em: http://localhost:9002

## 🔧 Variáveis de Ambiente Necessárias
Crie um arquivo .env.local com:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

XAI_API_KEY=
GROQ_API_KEY=
AIRFORCE_API_KEY=
```

## 📄 Licença
Este software é proprietário.  
Todos os direitos reservados a Davi Alves Figueredo e W1 Capital Assessoria Financeira Ltda.  
Uso, cópia ou modificação não autorizada é proibida.  
Para parcerias ou licenciamento: w1capitalassessoria@protonmail.com

© 2026 W1 Capital. Todos os direitos reservados.
