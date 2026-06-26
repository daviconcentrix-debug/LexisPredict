# ⚖️ LexisPredict AI

> Plataforma inteligente para análise jurídica, gestão processual e apoio estratégico à tomada de decisões.

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-blue)
![License](https://img.shields.io/badge/license-Private-red)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)
![OpenRouter](https://img.shields.io/badge/OpenRouter-AI-000000)

---

## 📖 Sobre

O **LexisPredict AI** é uma plataforma de inteligência jurídica desenvolvida para otimizar a análise processual, automatizar fluxos de trabalho e fornecer suporte estratégico baseado em inteligência artificial.

A aplicação integra diferentes motores de IA e serviços jurídicos para gerar análises detalhadas, resumos processuais, avaliações de risco e apoio à tomada de decisão.

---

# Principais Recursos

- ⚖️ Análise jurídica inteligente
- 🤖 Múltiplos provedores de IA
- 📑 Resumo automático de processos
- 📊 Dashboard analítico
- 📈 Estatísticas processuais
- 🔍 Consulta integrada de processos
- ☁️ Sincronização em nuvem
- 🔐 Autenticação segura
- 📝 Gestão de carteira processual
- 📤 Relatórios exportáveis
- ⚡ Cache inteligente
- 📚 Histórico de análises

---

# Inteligência Artificial

O sistema suporta múltiplos provedores de IA:

- OpenRouter
- Groq
- Google Gemini

A arquitetura foi desenvolvida para permitir a inclusão de novos provedores sem alterações significativas na aplicação.

---

# Integrações

- Supabase
- DataJud (CNJ)
- OpenRouter
- Groq
- Google Gemini

---

# Tecnologias

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- PostgreSQL
- OpenRouter API
- BASEADO NO SALESFORCE
- GROK API
- GEMINI API
- DATAJUD API
- MOTOR INTERNO LOCAL
- MAPEAMENTO E RELATORIO DE PLANILHAS
- AUTOMATIZAÇÃO DE PLANILHAS

---

# Estrutura do Projeto

```text
src/
├── components/
├── pages/
├── hooks/
├── services/
├── lib/
├── contexts/
├── utils/
├── types/
├── assets/
└── styles/
```

---

# Instalação

Clone o projeto:

```bash
git clone https://github.com/SEU-USUARIO/lexispredict.git
```

Entre na pasta:

```bash
cd lexispredict
```

Instale as dependências:

```bash
npm install
```

Configure as variáveis de ambiente:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

OPENROUTER_API_KEY=
GROQ_API_KEY=
GEMINI_API_KEY=

DATAJUD_TOKEN=
```

Execute:

```bash
npm run dev
```

Build:

```bash
npm run build
```

---

# Arquitetura

```text
                Frontend

                    │

          API / Backend Gateway

      ┌─────────────┼─────────────┐
      │             │             │
 OpenRouter      DataJud      Gemini/Groq
      │             │             │
      └─────────────┼─────────────┘

              Supabase Database
```

---

# Objetivos

- Centralizar consultas jurídicas
- Automatizar análises processuais
- Apoiar decisões estratégicas
- Reduzir tempo operacional
- Organizar carteiras processuais
- Integrar múltiplas fontes de dados

---

# Roadmap

- [x] Integração com Supabase
- [x] Dashboard jurídico
- [x] IA integrada
- [x] Consulta processual
- [x] Histórico de análises
- [ ] Assistente jurídico contextual
- [ ] RAG com documentos
- [ ] Vetorização de jurisprudência
- [ ] OCR de documentos
- [ ] Aplicativo mobile
- [ ] API pública

---

# Segurança

- Variáveis sensíveis protegidas
- Autenticação segura
- Controle de acesso
- Persistência em banco PostgreSQL
- Sincronização protegida

---

# Contribuição

Contribuições são bem-vindas.

1. Faça um Fork
2. Crie uma branch
3. Commit suas alterações
4. Abra um Pull Request

---

# Licença

Este projeto é de uso privado.

Todos os direitos reservados.

---

# Desenvolvedor

**Davi Alves Figueredo**

Desenvolvido com foco em inovação, automação e inteligência aplicada ao setor jurídico.
