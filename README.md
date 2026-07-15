# LexisPredict

**Plataforma de Operações Jurídicas Avançadas**  
*W1 Capital • Advanced Legal Ops*

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Optional-3ECF8E?style=flat&logo=supabase)

**LexisPredict** é um sistema completo de gestão jurídica e operações legais desenvolvido internamente pela **W1 Capital**. Ele substitui planilhas, fluxos manuais e ferramentas fragmentadas por uma plataforma inteligente, resiliente e de alta performance.

---

### 🚀 Principais Funcionalidades

- **Extração Inteligente de Contratos** — IA híbrida (Grok 4.5 + DeepSeek V3 + Regex) para extrair dados de PDFs de contratos bancários
- **Geração de Procurações Forenses** — Criação automática de procurações com revisão manual e geração de PDF com fidelidade documental
- **Gestão de Prazos e Riscos** — Cálculo automático de status (Vencido, É Hoje, Atenção, No Prazo), distribuição por tribunal e índice de risco da carteira
- **Dashboard Operacional** — Visão executiva com KPIs, triagem de casos prioritários e gráficos de distribuição
- **Modo Offline-First** — Funciona 100% sem internet usando localStorage + sincronização quando possível
- **Interface Executiva Customizável** — Temas profissionais, wallpaper, glassmorphism, contraste AAA e persistência total
- **Dossiê Forense (Master Report)** — Relatório consolidado em PDF pronto para uso jurídico e apresentação

---

### 🏗️ Arquitetura

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Persistência**: Local-first (localStorage) com Supabase opcional
- **IA**: Grok 4.5 (principal) + DeepSeek V3 (fallback) + sistema de resgate por regex
- **PDF**: Extração com `pdf-parse` + geração com `@react-pdf/renderer`
- **Design**: Totalmente customizável com variáveis CSS e modo executivo

---

### 📊 Status Atual (Julho 2026)

- ✅ Sistema 100% funcional e em uso diário
- ✅ Migração completa do Firebase concluída
- ✅ Motor de detecção de tribunais via CNJ funcionando
- ✅ Geração de procurações com revisão forense
- ✅ Auditoria de operações com IA própria
- ✅ Interface executiva com temas e wallpaper
- ✅ Modo offline-first estável

---

### 👤 Sobre

Desenvolvido por **Davi Alves Figueredo** para uso interno da **W1 Capital Assessoria Financeira Ltda.**

Este é um software **proprietário**.  
Todo o código, lógica de negócio, prompts de IA e design são de propriedade exclusiva de Davi Alves Figueredo e W1 Capital.

**Contato para parcerias, licenciamento ou contratações:**  
w1capitalassessoria@protonmail.com

---

### 📄 Licença

Todo o conteúdo deste repositório é protegido por direitos autorais.  
Consulte o arquivo [LICENSE](LICENSE) para os termos completos.

**Proibida** a cópia, modificação, redistribuição ou uso comercial sem autorização expressa por escrito.

---

### 🛡️ Proteção Legal

Este software é registrado como propriedade intelectual de Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.  
Qualquer uso não autorizado pode resultar em medidas legais cabíveis.

---

**Desenvolvido com excelência para operações jurídicas de alto nível.**

*W1 Capital • Advanced Legal Operations • 2026*