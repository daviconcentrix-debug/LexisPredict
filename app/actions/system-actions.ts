
/**
 * @fileOverview Motor de Exportação de Infraestrutura v670.0 ELITE
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved.
 */
'use server';

import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

/**
 * Realiza a varredura e compressão de todo o diretório do projeto.
 * Exclui deliberadamente pastas de sistema para entregar um projeto pronto para GitHub.
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

      // Filtros de Higiene de Código (Whitelist-like exclusion)
      const blackList = [
        'node_modules',
        '.next',
        '.git',
        '.agents',
        'dist',
        '.vercel',
        '.env.local',
        '.env',
        '.DS_Store'
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
    addFilesRecursively(rootPath);
    
    // Gerar o buffer do ZIP no servidor com compressão máxima
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
