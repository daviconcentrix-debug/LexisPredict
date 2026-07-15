'use client';

import React, { useState } from 'react';

export default function HabilitacaoPage() {
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

  const [advogadoNome, setAdvogadoNome] = useState("DIEGO GOMES DIAS");
  const [advogadoOab, setAdvogadoOab] = useState("370.898");
  const [advogadoEndereco, setAdvogadoEndereco] = useState("Av. São Miguel, nº 4810, Ponte Rasa, São Paulo-SP");
  const [advogadoCep, setAdvogadoCep] = useState("03870-100");
  const [advogadoEmail, setAdvogadoEmail] = useState("diego.gomesdias@yahoo.com.br");

  const [tipoAcao, setTipoAcao] = useState("AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA");
  const [reuNome, setReuNome] = useState("BANCO AYMORÉ CRÉDITO, FINANCIAMENTO E INVESTIMENTO S.A.");
  const [reuCnpj, setReuCnpj] = useState("07.707.650/0001-10");

  const dataAtual = new Date();
  const dataFormatada = dataAtual.toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">HABILITAÇÃO + PROCURAÇÃO</h1>
        <span className="px-3 py-1 text-xs bg-gray-200 rounded-full">PEÇA COMBINADA</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Formulário */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Gabinete Técnico */}
          <div className="border border-black p-6 bg-white">
            <div className="bg-black text-white px-4 py-2 -mx-6 -mt-6 mb-6">
              <h2 className="font-bold">1. GABINETE TÉCNICO</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="mt-4">
              <label className="text-sm font-medium">PROCESSO Nº</label>
              <input 
                type="text" 
                value={numeroProcesso} 
                onChange={(e) => setNumeroProcesso(e.target.value)}
                className="w-full border p-2 mt-1" 
              />
            </div>
          </div>

          {/* 2. Dados do Cliente */}
          <div className="border border-black p-6 bg-white">
            <div className="bg-black text-white px-4 py-2 -mx-6 -mt-6 mb-6">
              <h2 className="font-bold">2. DADOS DO CLIENTE</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">NOME COMPLETO</label>
                <input type="text" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} className="w-full border p-2 mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">CPF</label>
                <input type="text" value={clienteCpf} onChange={(e) => setClienteCpf(e.target.value)} className="w-full border p-2 mt-1" />
              </div>
            </div>
          </div>

          {/* Botão de Gerar */}
          <button 
            onClick={() => alert('Função de geração ainda não implementada')}
            className="w-full bg-black text-white py-3 font-bold hover:bg-gray-800 transition-colors"
          >
            GERAR PEÇA DE HABILITAÇÃO + PROCURAÇÃO
          </button>
        </div>

        {/* Preview */}
        <div className="border border-dashed p-6 bg-white min-h-[400px]">
          <h3 className="font-bold mb-4">PREVIEW DO DOCUMENTO</h3>
          <div className="text-sm text-gray-500">
            Aqui vai aparecer o preview da peça gerada...
          </div>
        </div>
      </div>
    </div>
  );
}
