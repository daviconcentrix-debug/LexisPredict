
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
    lineHeight: 1.5,
    textAlign: 'justify'
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 40,
    textTransform: 'uppercase'
  },
  paragraph: {
    marginBottom: 15,
    textIndent: 40
  },
  bold: {
    fontWeight: 'bold'
  },
  underline: {
    textDecoration: 'underline'
  },
  date: {
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 50
  },
  signatureArea: {
    textAlign: 'center',
    marginTop: 40
  },
  signatureLine: {
    width: '70%',
    borderTop: '1pt solid black',
    alignSelf: 'center',
    marginBottom: 10
  }
});

export function ProcuracaoPDF({ data }: { data: any }) {
  const { cliente, advogado, processos, local, dataExtenso } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>PROCURAÇÃO "AD JUDICIA"</Text>
        
        <View style={styles.paragraph}>
          <Text>
            <Text style={styles.bold}>{cliente.nome.toUpperCase()}</Text>, brasileiro, {cliente.estadoCivil}, {cliente.profissao}, portador do RG sob Nº {cliente.rg} e devidamente inscrito no CPF sob Nº {cliente.cpf}, residente e domiciliado à {cliente.endereco}, com endereço eletrônico: {cliente.email || 'Não informado'}, neste ato nomeia como seu procurador:
          </Text>
        </View>

        <View style={styles.paragraph}>
          <Text>
            <Text style={styles.bold}>{advogado.nome.toUpperCase()}</Text>, brasileiro, {advogado.cargo}, inscrito na OAB sob o número {advogado.oab}, com endereço profissional na {advogado.endereco}, e endereço eletrônico: {advogado.email}.
          </Text>
        </View>

        <View style={styles.paragraph}>
          <Text>
            <Text style={styles.bold}>PODERES: </Text>
            Por este instrumento particular de mandato, o(a) outorgante retro referenciada nomeia e constitui seu bastante procurador o advogado também acima qualificado, a quem confere amplos poderes para o foro em geral, com a cláusula “AD JUDICIA”, em qualquer Juízo, Instância ou Tribunal, podendo propor contra quem de direito as ações competentes e defendê-lo nas contrárias, seguindo umas e outras, até final decisão, usando os recursos legais e acompanhando-os, conferindo-lhes, ainda, poderes especiais para desistir, transigir, firmar compromissos ou acordos, receber e dar quitação, agindo em conjunto ou separadamente e independente da ordem de nomeação, podendo substabelecer esta em outrem, com ou sem reservas de iguais poderes, especialmente para, na defesa dos interesses do(a) outorgante, agir nos autos da {processos?.map((p: any, i: number) => (
              <React.Fragment key={i}>
                <Text style={[styles.bold, styles.underline]}>{p.acao}</Text> promovida contra <Text style={styles.bold}>{p.banco.toUpperCase()}</Text>, processo nº {p.numero}{i < processos.length - 1 ? '; ' : '.'}
              </React.Fragment>
            ))}
          </Text>
        </View>

        <Text style={styles.date}>{local || 'São Paulo - SP'}, {dataExtenso || new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</Text>

        <View style={styles.signatureArea}>
          <View style={styles.signatureLine} />
          <Text style={styles.bold}>{cliente.nome.toUpperCase()}</Text>
        </View>
      </Page>
    </Document>
  );
}
