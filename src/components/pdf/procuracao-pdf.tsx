/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved. See LICENSE file.
 */
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'Times-Roman',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman@1.0.4/Times-New-Roman.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman@1.0.4/Times-New-Roman-Bold.ttf', fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: '30mm 25mm',
    fontFamily: 'Times-Roman',
    fontSize: 12,
    lineHeight: 1.6,
    textAlign: 'justify',
    color: '#000000'
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 40,
    textTransform: 'uppercase'
  },
  paragraph: {
    marginBottom: 20,
    textIndent: 50,
  },
  bold: {
    fontWeight: 'bold'
  },
  date: {
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 40
  },
  signatureArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 20,
  },
  line: {
    width: '70%',
    borderTop: '1pt solid black',
    marginBottom: 5,
  }
});

export function ProcuracaoPDF({ data }: { data: any }) {
  const { cliente, advogado, processos, local, dataExtenso } = data;
  
  // Extração de dados do primeiro processo para o modelo padrão
  const acaoPrincipal = processos?.[0]?.acao || "AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA";
  const bancoPrincipal = processos?.[0]?.banco || "INSTITUIÇÃO FINANCEIRA";
  const numeroPrincipal = processos?.[0]?.numero || "S/N";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>PROCURAÇÃO "AD JUDICIA"</Text>
        
        <View style={styles.paragraph}>
          <Text>
            <Text style={styles.bold}>{cliente.nome.toUpperCase()}</Text>, {cliente.nacionalidade || "brasileiro(a)"}, {cliente.estadoCivil || "casado(a)"}, {cliente.profissao || "autônomo(a)"}, portador do RG sob Nº {cliente.rg} e devidamente inscrito no CPF sob Nº {cliente.cpf}, residente e domiciliado à {cliente.endereco}, com endereço eletrônico: {cliente.email || 'Não informado'}, neste ato nomeia como seu procurador:
          </Text>
        </View>

        <View style={styles.paragraph}>
          <Text>
            <Text style={styles.bold}>{advogado.nome.toUpperCase()}</Text>, brasileiro, advogado, inscrito na OAB sob o número {advogado.oab}, com endereço profissional na {advogado.endereco}, e endereço eletrônico: {advogado.email}.
          </Text>
        </View>

        <View style={styles.paragraph}>
          <Text>
            <Text style={styles.bold}>PODERES: </Text>
            Por este instrumento particular de mandato, o(a) outorgante retro referenciada nomeia e constitui seu bastante procurador o advogado também acima qualificado, a quem confere amplos poderes para o foro em geral, com a cláusula <Text style={styles.bold}>“AD JUDICIA”</Text>, em qualquer Juízo, Instância ou Tribunal, podendo propor contra quem de direito as ações competentes e defendê-lo nas contrárias, seguindo umas e outras, até final decisão, usando os recursos legais e acompanhando-os, conferindo-lhes, ainda, poderes especiais para desistir, transigir, firmar compromissos ou acordos, receber e dar quitação, agindo em conjunto ou separadamente e independente da ordem de nomeação, podendo substabelecer esta em outrem, com ou sem reservas de iguais poderes, especialmente para, na defesa dos interesses do(a) outorgante, agir nos autos da <Text style={styles.bold}>{acaoPrincipal.toUpperCase()}</Text> promovida contra <Text style={styles.bold}>{bancoPrincipal.toUpperCase()}</Text>, processo nº {numeroPrincipal}.
          </Text>
        </View>

        <Text style={styles.date}>{local}, {dataExtenso}</Text>

        <View style={styles.signatureArea}>
          <View style={styles.line} />
          <Text style={styles.bold}>{cliente.nome.toUpperCase()}</Text>
        </View>
      </Page>
    </Document>
  );
}
