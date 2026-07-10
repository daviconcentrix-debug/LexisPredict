
/**
 * MOTOR DE INTERNACIONALIZAÇÃO v3000.0 ELITE
 * Dicionários oficiais para o Gabinete W1 Capital.
 */
export type Locale = 'pt' | 'en';

export const translations = {
  pt: {
    management: "Gestão",
    operations: "Operações",
    system: "Sistema",
    dashboard: "Dashboard",
    cases: "Processos",
    clients: "Clientes",
    team: "Equipe",
    audit: "Auditoria 3D",
    documents: "Documentos",
    chat: "Consultoria",
    whatsapp: "Comunicação",
    import: "Ingestão",
    notes: "Evidências",
    analytics: "Indicadores",
    urgency: "Motor Urgência",
    settings: "Configurações",
    logout: "Sair",
    activeTelemetry: "Telemetria Ativa",
    controlPanel: "Painel de Controle",
    priorityQueue: "Fila de Prioridade",
    statusVencido: "Vencido",
    statusAtencao: "Atenção",
    statusPrazo: "No Prazo",
    statusHoje: "É Hoje",
    statusCritico: "Crítico",
    statusArquivado: "Arquivado",
    statusEncerrado: "Encerrado",
    statusSemPrazo: "Sem Prazo",
    roleAdmin: "Administrador",
    roleOperator: "Operador",
    roleViewer: "Visualizador",
    teamTitle: "Gestão de Autoridade",
    teamSubtitle: "Níveis de acesso e hierarquia do gabinete."
  },
  en: {
    management: "Management",
    operations: "Operations",
    system: "System",
    dashboard: "Dashboard",
    cases: "Legal Cases",
    clients: "Clients",
    team: "Team",
    audit: "3D Audit",
    documents: "Documents",
    chat: "Advisory Chat",
    whatsapp: "WhatsApp Hub",
    import: "Data Ingestion",
    notes: "Evidence Logs",
    analytics: "Analytics",
    urgency: "Urgency Engine",
    settings: "Settings",
    logout: "Sign Out",
    activeTelemetry: "Active Telemetry",
    controlPanel: "Control Panel",
    priorityQueue: "Priority Queue",
    statusVencido: "Overdue",
    statusAtencao: "Attention",
    statusPrazo: "On Track",
    statusHoje: "Due Today",
    statusCritico: "Critical",
    statusArquivado: "Archived",
    statusEncerrado: "Closed",
    statusSemPrazo: "No Deadline",
    roleAdmin: "Administrator",
    roleOperator: "Operator",
    roleViewer: "Viewer",
    teamTitle: "Authority Management",
    teamSubtitle: "Access levels and cabinet hierarchy."
  }
};

export function getTranslation(locale: Locale) {
  return translations[locale] || translations.pt;
}
