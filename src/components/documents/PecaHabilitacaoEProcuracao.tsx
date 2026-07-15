'use client';

import React, { useState } from 'react';

export function PecaHabilitacaoEProcuracao() {
  // ==================== ESTADOS ====================
  const [vara, setVara] = useState("02ª VARA CÍVEL");
  const [comarca, setComarca] = useState("JAGUARIUNA - SP");
  const [numeroProcesso, setNumeroProcesso] = useState("1003224-40.2025.8.26.0296");

  const [clienteNome, setClienteNome] = useState("EBERT RONALD LEME");
  const [clienteNacionalidade, setClienteNacionalidade] = useState("brasileiro");
  const [clienteEstadoCivil, setClienteEstadoCivil] = useState("casado");
  const [clienteProfissao, setClienteProfissao] = useState("empresário");
  const [clienteRg, setClienteRg] = useState("26130466");
  const [clienteCpf, setClienteCpf] = useState("300.483.608-48");
  const [clienteEndereco, setClienteEndereco] = useState("Rua: Maranhão, número: 489, Casa 13, Jardim Bela Vista, Jaguariúna - SP");
  const [clienteCep, setClienteCep] = useState("13911-414");
  const [clienteEmail, setClienteEmail] = useState("ebertrl@hotmail.com");

  const [advogadoNome, setAdvogadoNome] = useState("DIEGO GOMES DIAS");
  const [advogadoOab, setAdvogadoOab] = useState("370.898");
  const [advogadoEndereco, setAdvogadoEndereco] = useState("Av. São Miguel, nº 4810, Ponte Rasa, São Paulo-SP");
  const [advogadoCep, setAdvogadoCep] = useState("03870-100");
  const [advogadoEmail1, setAdvogadoEmail1] = useState("lucenadiasadvogados@gmail.com");
  const [advogadoEmail2, setAdvogadoEmail2] = useState("diego.gomesdias@yahoo.com.br");

  const [tipoAcao, setTipoAcao] = useState("AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA");
  const [reuNome, setReuNome] = useState("BANCO AYMORÉ CRÉDITO, FINANCIAMENTO E INVESTIMENTO S.A.");
  const [reuCnpj, setReuCnpj] = useState("07.707.650/0001-10");
  const [cidadeEmissao, setCidadeEmissao] = useState("São Paulo");

  // ==================== DATA ====================
  const dataAtual = new Date();
  const dataFormatada = dataAtual.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // ==================== ESTILOS (Inline) ====================
  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px',
      fontFamily: 'serif',
      color: '#000',
      fontSize: '12pt',
      lineHeight: '1.6',
      backgroundColor: '#fff'
    },
    header: {
      textAlign: 'center' as const,
      fontWeight: 'bold',
      textTransform: 'uppercase' as const,
      marginBottom: '20px'
    },
    paragraph: {
      textAlign: 'justify' as const,
      textIndent: '50px',
      marginBottom: '20px'
    },
    centerText: {
      textAlign: 'center' as const,
      marginBottom: '20px'
    },
    signatureBlock: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      marginTop: '60px',
      marginBottom: '60px'
    },
    signatureLine: {
      width: '300px',
      borderTop: '1px solid #000',
      marginBottom: '5px'
    },
    pageBreak: {
      pageBreakBefore: 'always' as const,
      marginTop: '40px'
    }
  };

  return (
    <div style={styles.container}>
      {/* ==================== PEÇA DE HABILITAÇÃO ==================== */}
      <p style={{ ...styles.header, marginBottom: '40px' }}>
        EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA {vara} DA COMARCA DE {comarca}.
      </p>

      <p style={{ textAlign: 'right', fontWeight: 'bold', marginBottom: '40px' }}>
        Processo nº {numeroProcesso}
      </p>

      <p style={styles.paragraph}>
        <strong>{clienteNome.toUpperCase()}</strong>, {clienteNacionalidade}, {clienteEstadoCivil}, {clienteProfissao}, portador da cédula de identidade RG número {clienteRg} e inscrito no CPF/MF sob o nº {clienteCpf}, residente e domiciliado na {clienteEndereco}, CEP: {clienteCep}, vem, respeitosamente, à presença de Vossa Excelência, por seu procurador, ora constituído, apresentar seu pedido de habilitação e requerer a juntada do anexo instrumento particular de mandato.
      </p>

      <p style={styles.paragraph}>
        Inicialmente, requer-se que as intimações sejam feitas em nome do procurador <strong>Dr. {advogadoNome.toUpperCase()}</strong>, inscrito na <strong>OAB/SP {advogadoOab}</strong>, com escritório profissional na {advogadoEndereco}, CEP {advogadoCep}, e-mail: {advogadoEmail1}, requerendo que seja feita as respectivas anotações que se fizerem necessárias.
      </p>

      <p style={styles.centerText}>Nestes Termos<br />Pede Deferimento.</p>

      <p style={{ ...styles.centerText, marginTop: '40px' }}>
        {cidadeEmissao}, {dataFormatada}.
      </p>

      <div style={styles.signatureBlock}>
        <div style={styles.signatureLine}></div>
        <strong>{advogadoNome.toUpperCase()}</strong>
        <strong>OAB/SP Nº {advogadoOab}</strong>
      </div>

      {/* ==================== PROCURAÇÃO AD JUDICIA ==================== */}
      <div style={styles.pageBreak}></div>

      <h1 style={{ ...styles.header, fontSize: '14pt' }}>PROCURAÇÃO "AD JUDICIA"</h1>

      <p style={styles.paragraph}>
        <strong>{clienteNome.toUpperCase()}</strong>, {clienteNacionalidade}, {clienteEstadoCivil}, {clienteProfissao}, portador do RG sob Nº {clienteRg} e devidamente inscrito no CPF sob Nº {clienteCpf}, residente e domiciliado à {clienteEndereco} CEP: {clienteCep}, {clienteEmail}, neste ato nomeia como seu procurador:
      </p>

      <p style={styles.paragraph}>
        <strong>{advogadoNome.toUpperCase()}</strong>, brasileiro, advogado, inscrito na OAB/SP sob o número {advogadoOab}, com endereço profissional na {advogadoEndereco}, CEP {advogadoCep}, e endereço eletrônico: {advogadoEmail2}.
      </p>

      <p style={styles.paragraph}>
        <strong>PODERES:</strong> Por este instrumento particular de mandato, o(a) outorgante retro referenciada nomeia e constitui seu bastante procurador o advogado também acima qualificado, a quem confere amplos poderes para o foro em geral, com a cláusula <strong>"AD JUDICIA"</strong>, em qualquer Juízo, Instância ou Tribunal, podendo propor contra quem de direito as ações competentes e defendê-lo nas contrárias, seguindo umas e outras, até final decisão, usando os recursos legais e acompanhando-os, conferindo-lhes, ainda, poderes especiais para desistir, transigir, firmar compromissos ou acordos, receber e dar quitação, agindo em conjunto ou separadamente e independente da ordem de nomeação, podendo substabelecer esta em outrem, com ou sem reservas de iguais poderes, especialmente para, na defesa dos interesses do(a) outorgante, agir nos autos da <strong>{tipoAcao.toUpperCase()}</strong> promovida contra o <strong>{reuNome.toUpperCase()}</strong>, inscrito no CNPJ nº {reuCnpj}.
      </p>

      <p style={{ ...styles.centerText, marginTop: '60px' }}>
        {cidadeEmissao}, {dataFormatada}.
      </p>

      <div style={styles.signatureBlock}>
        <div style={styles.signatureLine}></div>
        <strong>{clienteNome.toUpperCase()}</strong>
      </div>
    </div>
  );
}
