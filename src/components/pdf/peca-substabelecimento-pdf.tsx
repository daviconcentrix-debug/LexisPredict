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
  page: { padding: '40mm 25mm', fontFamily: 'Times-Roman', fontSize: 12, lineHeight: 1.8, textAlign: 'justify', color: '#000000' },
  title: { textAlign: 'center', fontWeight: 'bold', fontSize: 14, letterSpacing: 2, marginBottom: 5 },
  subtitle: { textAlign: 'center', fontWeight: 'bold', fontSize: 12, marginBottom: 60 },
  paragraph: { marginBottom: 40, textIndent: 60 },
  bold: { fontWeight: 'bold' },
  date: { textAlign: 'center', marginTop: 40, marginBottom: 80 },
  signatureArea: { textAlign: 'center', marginTop: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  signatureLine: { width: '60%', borderTop: '1pt solid black', alignSelf: 'center', marginBottom: 8 }
});

export function PecaSubstabelecimentoPDF({ data }: { data: any }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>SUBSTABELECIMENTO</Text>
        <Text style={styles.subtitle}>(sem reserva de poderes)</Text>
        
        <View style={styles.paragraph}>
          <Text>
            O <Text style={styles.bold}>{data.advogadoSubstabelecente}</Text>, brasileiro, {data.estadoCivilSubstabelecente}, advogado, inscrito na <Text style={styles.bold}>{data.oabSubstabelecente}</Text>, <Text style={styles.bold}>SUBSTABELECE SEM RESERVA DE PODERES</Text> na pessoa do <Text style={styles.bold}>{data.advogadoSubstabelecido}</Text>, inscrito na <Text style={styles.bold}>{data.oabSubstabelecido}</Text>, os poderes conferidos por <Text style={styles.bold}>{data.clienteNome}</Text>, <Text style={styles.bold}>PARA A PROMOÇÃO DE {data.tipoAcao}</Text>, processo de n.º <Text style={styles.bold}>{data.numeroProcesso}</Text> por meio do instrumento outrora outorgado, requerendo a exclusão do advogado substabelecente <Text style={styles.bold}>{data.advogadoSubstabelecente}</Text> sob <Text style={styles.bold}>{data.oabSubstabelecenteCurta}</Text> da contracapa dos autos, bem como de qualquer outro meio de intimação do processo, sendo assim que <Text style={styles.bold}>todas as futuras intimações passem a ser exclusivamente dirigidas ao substabelecido</Text>, <Text style={styles.bold}>{data.advogadoSubstabelecido}</Text> sob <Text style={styles.bold}>{data.oabSubstabelecidoCurta}</Text>, nos termos do artigo 272, §5º, do CPC, sob pena de nulidade.
          </Text>
        </View>

        <Text style={styles.date}>{data.cidadeComarca}, {data.dataFormatada}</Text>

        <View style={styles.signatureArea}>
          <View style={styles.signatureLine} />
          <Text style={styles.bold}>{data.advogadoSubstabelecente}</Text>
          <Text style={styles.bold}>{data.oabSubstabelecenteCurta}</Text>
        </View>

        <View style={{ marginTop: 60 }} />

        <View style={styles.signatureArea}>
          <View style={styles.signatureLine} />
          <Text style={styles.bold}>{data.advogadoSubstabelecido}</Text>
          <Text style={styles.bold}>{data.oabSubstabelecidoCurta}</Text>
        </View>
      </Page>
    </Document>
  );
}
