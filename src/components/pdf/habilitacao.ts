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
  page: { padding: '40mm 25mm', fontFamily: 'Times-Roman', fontSize: 12, lineHeight: 1.6, textAlign: 'justify' },
  header: { textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 30 },
  paragraph: { textIndent: 50, marginBottom: 15 },
  bold: { fontWeight: 'bold' },
  right: { textAlign: 'right', fontWeight: 'bold', marginBottom: 30 },
  center: { textAlign: 'center', marginTop: 40 },
  signatureArea: { textAlign: 'center', marginTop: 50, alignItems: 'center' },
  line: { width: '60%', borderTop: '1pt solid black', marginBottom: 5 }
});

export function HabilitacaoPDF({ data }: { data: any }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA {data.vara} DA COMARCA DE {data.comarca}</Text>
        <Text style={styles.right}>Processo nº {data.numeroProcesso}</Text>
        <Text style={styles.paragraph}><Text style={styles.bold}>{data.clienteNome.toUpperCase()}</Text>, {data.clienteNacionalidade}, {data.clienteEstadoCivil}, {data.clienteProfissao}, portador do RG {data.clienteRg} e CPF {data.clienteCpf}, residente em {data.clienteEndereco}, vem requerer sua HABILITAÇÃO nos autos.</Text>
        <Text style={styles.paragraph}>Requer que as intimações sejam feitas em nome de <Text style={styles.bold}>{data.advogadoNome.toUpperCase()}</Text>, OAB {data.advogadoOab}.</Text>
        <Text style={styles.center}>Nestes Termos, Pede Deferimento.</Text>
        <View style={styles.signatureArea}>
          <View style={styles.line} />
          <Text style={styles.bold}>{data.advogadoNome.toUpperCase()}</Text>
          <Text style={styles.bold}>OAB Nº {data.advogadoOab}</Text>
        </View>
      </Page>
    </Document>
  );
}
