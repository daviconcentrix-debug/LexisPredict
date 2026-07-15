/**
 * @fileOverview Motor de Exportação de Infraestrutura v640.0 ELITE
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved.
 */
'use server';

import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

/**
 * Realiza a varredura e compressão de todo o diretório do projeto.
 * Exclui deliberadamente node_modules, .next e outros arquivos de cache.
 */
export async function exportFullSourceCodeAction() {
  const rootPath = process.cwd();
  const zip = new JSZip();

  function addFilesRecursively(currentPath: string) {
    const files = fs.readdirSync(currentPath);

    for (const file of files) {
      const fullPath = path.join(currentPath, file);
      const stats = fs.statSync(fullPath);
      const relativePath = path.relative(rootPath, fullPath);

      // Filtros de Segurança e Performance
      const blackList = [
        'node_modules',
        '.next',
        '.git',
        '.agents',
        'dist',
        '.vercel',
        '.env.local',
        '.env'
      ];

      if (blackList.some(item => file === item || relativePath.startsWith(item))) {
        continue;
      }

      if (stats.isDirectory()) {
        addFilesRecursively(fullPath);
      } else {
        const content = fs.readFileSync(fullPath);
        zip.file(relativePath, content);
      }
    }
  }

  try {
    addFilesRecursively(rootPath);
    
    // Gerar o buffer do ZIP no servidor
    const content = await zip.generateAsync({ 
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 }
    });

    return { 
      success: true, 
      base64: content.toString('base64'),
      filename: `LexisPredict_FullBundle_${new Date().toISOString().split('T')[0]}.zip`
    };
  } catch (error: any) {
    console.error("Critical Export Failure:", error);
    return { success: false, error: error.message };
  }
}
