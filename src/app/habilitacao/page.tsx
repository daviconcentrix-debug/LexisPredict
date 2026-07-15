'use client';

import React, { useState } from 'react';

export default function HabilitacaoPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [textoContrato, setTextoContrato] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Estados do formulário
  const [vara, setVara] = useState("02ª VARA CÍVEL");
  const [comarca, setComarca] = useState("JAGUARIUNA - SP");
  const [numeroProcesso, setNumeroProcesso] = useState("");

  const [clienteNome, setClienteNome] = useState("");
  const [clienteCpf, setClienteCpf] = useState("");
  const [clienteRg, setClienteRg] = useState("");
  const [clienteEndereco, setClienteEndereco] = useState("");

  const [advogadoNome, setAdvogadoNome] = useState("DIEGO GOMES DIAS");
  const [advogadoOab, setAdvogadoOab] = useState("370.898");

  const [tipoAcao, setTipoAcao] = useState("AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA");
  const [reuNome, setReuNome] = useState("BANCO AYMORÉ CRÉDITO, FINANCIAMENTO E INVESTIMENTO S.A.");

  // Função para extrair dados (simulada por enquanto)
  const handleExtrairDados = async () => {
    if (!textoContrato && !pdfFile) {
      alert("Por favor, cole o texto ou envie um PDF.");
      return;
    }

    setIsLoading(true);

    // Simulação de extração (substitua pela sua função real de IA)
    setTimeout(() => {
      setClienteNome("EBERT RONALD LEME");
      setClienteCpf("300.483.608-48");
      setClienteRg("26130466");
      setNumeroProcesso("1003224-40.2025.8.26.0296");
      setTipoAcao("AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA");
      setReuNome("BANCO AYMORÉ CRÉDITO, FINANCIAMENTO E INVESTIMENTO S.A.");

      setIsLoading(false);
      alert("Dados extraídos com sucesso!");
    }, 1200);
  };

  const handleGerarPeca = () => {
    alert("Função de geração do PDF ainda não implementada. Vamos implementar na próxima etapa.");
    // Aqui você vai chamar a função que gera o PDF usando @react-pdf/renderer
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">HABILITAÇÃO + PROCURAÇÃO</h1>
        <span className="px-3 py-1 text-xs bg-black text-white rounded">PEÇA COMBINADA</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Formulário Principal */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Gabinete Técnico */}
          <div className="border border-black">
            <div className="bg-black text-white px-4 py-2">
              <h2 className="font-bold">1. GABINETE TÉCNICO</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">ADVOGADO</label>
                <input 
                  type="text" 
                  value={advogadoNome} 
                  onChange={(e) => setAdvogadoNome(e.target.value)}
                  className="w-full border p-2 mt-1" 
                />
              </div>
              <div>
                <label className="text-sm font-medium">OAB</label>
                <input 
                  type="text" 
                  value={advogadoOab} 
                  onChange={(e) => setAdvogadoOab(e.target.value)}
                  className="w-full border p-2 mt-1" 
                />
              </div>
            </div>
          </div>

          {/* 2. Dados do Processo */}
          <div className="border border-black">
            <div className="bg-black text-white px-4 py-2">
              <h2 className="font-bold">2. DADOS DO PROCESSO</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium">NÚMERO DO PROCESSO</label>
                <input 
                  type="text" 
                  value={numeroProcesso} 
                  onChange={(e) => setNumeroProcesso(e.target.value)}
                  className="w-full border p-2 mt-1" 
                />
              </div>

              <div>
                <label className="text-sm font-medium">CONTRATO / PETIÇÃO ANTIGA</label>
                <textarea 
                  value={textoContrato}
                  onChange={(e) => setTextoContrato(e.target.value)}
                  placeholder="COLE O TEXTO DO CONTRATO OU PETIÇÃO ANTIGA AQUI..."
                  className="w-full border p-3 mt-1 h-32"
                />
              </div>

              <button 
                onClick={handleExtrairDados}
                disabled={isLoading}
                className="w-full bg-black text-white py-3 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? "EXTRAINDO DADOS..." : "INICIAR TRIAGEM NEURAL"}
              </button>
            </div>
          </div>

          <button 
            onClick={handleGerarPeca}
            className="w-full bg-black text-white py-3 font-bold"
          >
            GERAR HABILITAÇÃO + PROCURAÇÃO
          </button>
        </div>

        {/* Upload de PDF */}
        <div className="border border-dashed p-6 bg-white h-fit">
