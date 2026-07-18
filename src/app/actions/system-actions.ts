/**
 * @fileOverview Motor de Exportação de Infraestrutura v680.0 ELITE
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved. See LICENSE file.
 */
'use server';

import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

/**
 * Realiza a varredura e compressão de todo o diretório do projeto.
 * Inclui agora a geração dinâmica do arquivo .env com as credenciais ativas.
 */
export async function exportFullSourceCodeAction() {
  const rootPath = process.cwd();
  const zip = new JSZip();

  function addFilesRecursively(currentPath: string) {
    if (!fs.existsSync(currentPath)) return;
    
    const files = fs.readdirSync(currentPath);

    for (const file of files) {
      const fullPath = path.join(currentPath, file);
      const relativePath = path.relative(rootPath, fullPath);
      
      let stats;
      try {
        stats = fs.statSync(fullPath);
      } catch (e) {
        continue;
      }

      // Filtros de Higiene de Código (Exclui lixo e pastas de sistema)
      const blackList = [
        'node_modules',
        '.next',
        '.git',
        '.agents',
        'dist',
        '.vercel',
        '.DS_Store',
        '.env',       // Excluímos os arquivos físicos para não duplicar com o dinâmico
        '.env.local'
      ];

      if (blackList.some(item => file === item || relativePath.startsWith(item))) {
        continue;
      }

      if (stats.isDirectory()) {
        addFilesRecursively(fullPath);
      } else {
        try {
          const content = fs.readFileSync(fullPath);
          zip.file(relativePath, content);
        } catch (e) {
          console.warn(`Skipping file due to read error: ${relativePath}`);
        }
      }
    }
  }

  try {
    // 1. Adicionar arquivos do projeto
    addFilesRecursively(rootPath);

    // 2. Protocolo de Exportação de Credenciais "Prontas"
    // Captura as variáveis de ambiente setadas no Vercel/Firebase e gera o .env
    const envKeys = [
      'XAI_API_KEY',
      'XAI_GROK_PRESTIGE_API_KEY',
      'XAI_DOCUMENTS_API_KEY',
      'GROQ_API_KEY',
      'AIRFORCE_API_KEY',
      'GEMINI_API_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'DATAJUD_API_KEY',
      'EVOLUTION_BASE_URL',
      'EVOLUTION_API_KEY',
      'EVOLUTION_INSTANCE',
      'MASTER_PASSWORD',
      'NEXT_PUBLIC_MASTER_PASSWORD'
    ];

    let envContent = '###########################################################\n';
    envContent += '# LEXISPREDICT ELITE - CREDENCIAIS DE PRODUÇÃO EXPORTADAS #\n';
    envContent += `# Gerado em: ${new Date().toLocaleString('pt-BR')}                     #\n`;
    envContent += '###########################################################\n\n';
    
    envKeys.forEach(key => {
      const val = process.env[key];
      if (val) {
        envContent += `${key}=${val}\n`;
      }
    });

    // Injeta o arquivo .env no ZIP
    zip.file('.env', envContent);
    zip.file('.env.production', envContent); // Cópia para ambiente de build
    
    // 3. Gerar o buffer do ZIP com compressão máxima (DEFLATE 9)
    const content = await zip.generateAsync({ 
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 }
    });

    return { 
      success: true, 
      base64: content.toString('base64'),
      filename: `LexisPredict_FullProject_v${new Date().toISOString().split('T')[0]}.zip`
    };
  } catch (error: any) {
    console.error("Critical Export Failure:", error);
    return { success: false, error: error.message };
  }
}
