# LexisPredict Elite

### Operações jurídicas e controle de prazos — em um só gabinete digital

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <b>Plataforma de gestão processual, prazos e geração de peças</b><br/>
  Desenvolvida para assessorias e escritórios que trocam planilha por operação real.
</p>

<p align="center">
  <a href="mailto:w1capitalassessoria@protonmail.com"><strong>Contato comercial</strong></a>
  ·
  <a href="#módulos">Módulos</a>
  ·
  <a href="#stack">Stack</a>
  ·
  <a href="#licença">Licença</a>
</p>

---

## Por que existe

Escritórios e assessorias convivem com:

- planilhas desatualizadas  
- prazos perdidos  
- procurações e substabelecimentos manuais  
- informação espalhada em WhatsApp, PDF e Excel  

**LexisPredict** concentra isso em um fluxo único: processos → prazos → peças → comunicação.

> Nascido do uso real em operação — não de um protótipo de vitrine.

---

## Módulos

| Módulo | O que entrega |
|--------|----------------|
| **Processos** | Cadastro, listagem, status, observações e acompanhamento |
| **Prazos & risco** | Visão de vencidos, atenção, no prazo e distribuição por tribunal (CNJ) |
| **Importação** | Ingestão de planilhas CSV para popular a base rapidamente |
| **Documentos** | Geração de **Procuração**, **Substabelecimento** e **Habilitação** |
| **IA operacional** | Extração de dados de contratos e apoio em chat / veredito |
| **WhatsApp** | Terminal integrado para rotina de atendimento |
| **Analytics** | Indicadores e visão gerencial |
| **Equipe & notas** | Multi-usuário por empresa e anotações internas |
| **Configurações** | Temas, preferências e personalização visual |

---

## Destaques

- **Multi-empresa** — isolamento por organização (`empresa_id`)
- **Peças jurídicas** — PDF pronto a partir de dados extraídos ou preenchidos
- **CNJ → tribunal** — categorização a partir do número do processo
- **Dashboard** — foco em o que vence e o que exige ação
- **Interface executiva** — visual sóbrio, pensado para uso diário longo
- **Stack moderna** — Next.js 15, TypeScript, Supabase

---

## Stack

```text
Frontend     Next.js 15 (App Router) · TypeScript · Tailwind · shadcn/ui
Backend      Server Actions · Supabase (Auth + Postgres)
IA           Integrações multi-provedor (configuráveis por ambiente)
PDF          @react-pdf/renderer · extração de texto de contratos
Deploy       Vercel (produção) · desenvolvimento assistido em studio

Visão rápida da arquitetura
text┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Interface Web  │────▶│  Server Actions  │────▶│  Supabase DB    │
│  (gabinete)     │     │  (regras + IA)   │     │  (multi-tenant) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                        │
         │                        ├──── Documentos PDF
         │                        ├──── Import CSV
         └────────────────────────┴──── WhatsApp / APIs externas

Começando (desenvolvimento)
Repositório proprietário. Clone e uso apenas com autorização do autor.
Bashgit clone https://github.com/daviconcentrix-debug/LexisPredict.git
cd LexisPredict
npm install
cp .env.example .env.local   # se existir; senão crie as variáveis abaixo
npm run dev
Variáveis de ambiente (exemplo)
Nunca commite chaves reais.
envNEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Provedores de IA (conforme configuração do projeto)
XAI_API_KEY=
GROQ_API_KEY=
AIRFORCE_API_KEY=

Para quem é

Perfil Uso típico Assessoria financeira / revisão bancária Volume de casos + peças recorrentes Escritório pequeno/médio Trocar planilha por sistema únic oOperação com equipe Multi-usuário, status e prazos visíveis

Status do projeto

Item Situaçã oUso em operação real AtivoCore (processos, auth, peças)Estável na linha de produçã oComercialização Em estruturação Contribuições externas Não abertas (código proprietário)

Licença
Software proprietário. Todos os direitos reservados.
Copyright © 2026 Davi Alves Figueredo
W1 Capital Assessoria Financeira Ltda.
É proibido copiar, modificar, distribuir, sublicenciar ou explorar comercialmente este software sem autorização expressa por escrito do titular.
Este repositório pode ser público apenas para portfólio e demonstração.
Publicação no GitHub não constitui licença de uso open source.

Contato
Comercial / parcerias: w1capitalassessoria@protonmail.com, Autor:Davi Alves Figueredo, Produto: LexisPredict Elite


  LexisPredict Elite — gabinete digital para quem vive de prazo e processo.

```
