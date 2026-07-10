
'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

/**
 * TEMPLATE PDF FORENSE v10500.0
 * Formatação rigorosa ABNT / Judiciário Brasileiro.
 */

const styles = StyleSheet.create({
  page: {
    padding: '30mm 25mm',
    fontFamily: 'Times-Roman',
    fontSize: 12,
    lineHeight: 1.5,
    color: '#000',
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 40,
    textTransform: 'uppercase',
  },
  paragraph: {
    marginBottom: 15,
    textAlign: 'justify',
    textIndent: 40,
  },
  bold: {
    fontWeight: 'bold',
  },
  underline: {
    textDecoration: 'underline',
  },
  date: {
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 60,
  },
  signatureArea: {
    textAlign: 'center',
    marginTop: 30,
    alignItems: 'center',
  },
  signatureLine: {
    width: '70%',
    borderTopWidth: 1,
    borderTopColor: '#000',
    marginBottom: 5,
  },
  signatureName: {
    fontWeight: 'bold',
    textTransform: 'uppercase',
  }
});

export const ProcuracaoPDF = ({ data }: { data: any }) => {
  const { cliente, advogado, processos, local, dataExtenso } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>PROCURAÇÃO "AD JUDICIA"</Text>

        <View style={styles.paragraph}>
          <Text>
            <Text style={styles.bold}>{cliente?.nome}</Text>, brasileiro, {cliente?.estadoCivil}, {cliente?.profissao}, 
            portador do RG sob Nº {cliente?.rg} e devidamente inscrito no CPF sob Nº {cliente?.cpf}, 
            residente e domiciliado à {cliente?.endereco}, com endereço eletrônico: {cliente?.email}, 
            neste ato nomeia como seu procurador:
          </Text>
        </View>

        <View style={styles.paragraph}>
          <Text>
            <Text style={styles.bold}>{advogado?.nome}</Text>, brasileiro, {advogado?.cargo}, inscrito na OAB sob o número {advogado?.oab}, 
            com endereço profissional na {advogado?.endereco}, e endereço eletrônico: {advogado?.email}.
          </Text>
        </View>

        <View style={styles.paragraph}>
          <Text>
            <Text style={styles.bold}>PODERES:</Text> Por este instrumento particular de mandato, o(a) outorgante retro referenciada nomeia 
            e constitui seu bastante procurador o advogado também acima qualificado, a quem confere amplos poderes para o foro em geral, 
            com a cláusula “AD JUDICIA”, em qualquer Juízo, Instância ou Tribunal, podendo propor contra quem de direito as ações 
            competentes e defendê-lo nas contrárias, seguindo umas e outras, até final decisão, usando os recursos legais e acompanhando-os, 
            conferindo-lhes, ainda, poderes especiais para desistir, transigir, firmar compromissos ou acordos, receber e dar quitação, 
            agindo em conjunto ou separadamente e independente da ordem de nomeação, podendo substabelecer esta em outrem, com ou sem 
            reservas de iguais poderes, especialmente para, na defesa dos interesses do(a) outorgante, agir nos autos da:
          </Text>
        </View>

        {processos?.map((p: any, i: number) => (
          <View key={i} style={styles.paragraph}>
            <Text>
              <Text style={styles.underline}>{p.acao}</Text> promovida contra <Text style={styles.bold}>{p.banco}</Text>, 
              processo nº {p.numero}.
            </Text>
          </View>
        ))}

        <Text style={styles.date}>{local}, {dataExtenso}.</Text>

        <View style={styles.signatureArea}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureName}>{cliente?.nome}</Text>
          <Text>Outorgante</Text>
        </View>
      </Page>
    </Document>
  );
};
