import { Sidebar } from '@/components/layout/sidebar';
    });
    
    return Array.from(uniqueContacts.values())
      .filter(c => 
        c.nome.toLowerCase().includes(search.toLowerCase()) || 
        c.telefone.includes(search)
      )
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [cases, search]);

  const filteredScripts = useMemo(() => {
    return SCRIPTS_GABINETE.filter(s => 
      s.title.toLowerCase().includes(scriptSearch.toLowerCase()) || 
      s.cat.toLowerCase().includes(scriptSearch.toLowerCase()) ||
      s.text.toLowerCase().includes(scriptSearch.toLowerCase())
    );
  }, [scriptSearch]);

  const handleApplyScript = (scriptText: string) => {
    let processed = scriptText;
    if (selectedContact) {
      processed = processed
        .replace(/\[NOME\]/g, selectedContact.nome)
        .replace(/\[PROTOCOLO\]/g, selectedContact.protocolo)
        .replace(/\[DATA\]/g, "00/00/0000")
        .replace(/\[HORA\]/g, "00:00")
        .replace(/\[MODALIDADE\]/g, "VIRTUAL")
        .replace(/\[USUARIO\]/g, "Setor Processual");
    }
    setAiResponse(processed);
    toast({ title: "Script Aplicado" });
  };

  const handleGenerateAI = async (agent: 'legal' | 'comercial' | 'financeiro') => {
    if (!selectedContact || isGenerating) {
      toast({ title: "Ação Bloqueada", description: "Selecione um contato primeiro.", variant: "destructive" });
      return;
    }
    
    setIsGenerating(true);
    setAiResponse(''); // Limpa antes de gerar

    const systemContext = `DADOS DO CLIENTE: ${selectedContact.nome}
    PROTOCOLO: ${selectedContact.protocolo}
    STATUS ATUAL: ${selectedContact.status}
    TRIBUNAL: ${selectedContact.tribunal}`;

    const prompts = {
      legal: `Redija uma atualização jurídica formal explicando o status '${selectedContact.status}' do processo ${selectedContact.protocolo}.`,
      comercial: `Redija uma mensagem de acompanhamento cordial para ${selectedContact.nome}, reafirmando nossa dedicação ao caso.`,
      financeiro: `Redija uma mensagem solicitando o pagamento das custas processuais ou honorários pendentes, citando a Cláusula 3.2 do contrato.`
    };

    try {
      const res = await perguntarIA({
        pergunta: `${systemContext}\n\nTarefa: ${prompts[agent]}`,
        preferredModel: preferredModel,
        historico: []
      });

      if (res && res.resposta && !res.error) {
        setAiResponse(res.resposta);
        toast({ title: "Mensagem Gerada", description: `Via motor ${res.engineUtilizada}` });
      } else {
        throw new Error(res?.resposta || "O motor neural falhou. Tente alternar o núcleo técnico no topo da tela.");
      }
    } catch (error: any) {
      toast({ title: "Erro de Triagem", description: error.message, variant: "destructive" });
      setAiResponse('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFromHistory = async () => {
    if (!selectedContact || !courtHistory.trim() || isGenerating) {
      toast({ title: "Dados Insuficientes", description: "Cole o histórico do tribunal para análise.", variant: "destructive" });
      return;
    }
    
    setIsGenerating(true);
    setAiResponse('');

    const prompt = `Analise este histórico de movimentações processuais:
    ---
    ${courtHistory.substring(0, 8000)}
    ---
    CLIENTE: ${selectedContact.nome}
    PROCESSO: ${selectedContact.protocolo}
    
    TAREFA: Gere uma mensagem de WhatsApp para o cliente resumindo os fatos de forma simples mas técnica, explicando o que aconteceu por último e quais os próximos passos esperados.`;

    try {
      const res = await perguntarIA({
        pergunta: prompt,
        preferredModel: preferredModel,
        historico: []
      });

      if (res && res.resposta && !res.error) {
        setAiResponse(res.resposta);
        toast({ title: "Análise Concluída", description: `Resumo técnico gerado via ${res.engineUtilizada}.` });
      } else {
        throw new Error(res?.resposta || "Falha na análise do histórico.");
      }
    } catch (error: any) {
      toast({ title: "Falha Neural", description: error.message, variant: "destructive" });
      setAiResponse('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendAPI = async () => {
    if (!selectedContact || !aiResponse || isSending) return;
    setIsSending(true);
    
    try {
      const result = await sendWhatsAppAction(selectedContact.telefone, aiResponse);
      if (result.success) {
        toast({ title: "Mensagem Entregue", description: "Enviado com sucesso via Evolution API." });
      } else {
        toast({ title: "Erro de Entrega", description: result.message, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Falha de Conexão", description: e.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = () => {
    if (!aiResponse) return;
    navigator.clipboard.writeText(aiResponse);
    toast({ title: "Copiado" });
  };

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black relative z-10 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-auto lg:h-16 border-b border-[#dddbda] bg-white/90 backdrop-blur-sm flex flex-col lg:flex-row lg:items-center justify-between px-6 lg:px-8 py-4 lg:py-0 shrink-0 z-40 gap-4">
          <div className="flex items-center gap-4 pl-10 lg:pl-0">
            <div className="icon-3d-wrapper scale-75 lg:scale-100">
              <div className="icon-3d-block black w-10 h-10 rounded-sm">
                <MessageCircle size={20} className="text-white" />
              </div>
            </div>
            <h1 className="font-black text-sm lg:text-xl text-black uppercase tracking-tighter">Terminal WhatsApp</h1>
          </div>
          
          <div className="flex items-center gap-3 self-end lg:self-auto">
            <div className="flex flex-col items-end mr-2">
               <span className="text-[8px] font-black uppercase text-black/40 mb-0.5">Seletor de Núcleo</span>
               <Select value={preferredModel} onValueChange={(val) => { setPreferredModel(val); localStorage.setItem('lexisPredict_preferred_ia', val); }}>
                <SelectTrigger className="w-[180px] border-2 border-black font-black uppercase text-[10px] h-9 rounded-none bg-white">
                  <SelectValue placeholder="Motor Neural" />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-black rounded-none">
                  <SelectItem value="xai" className="font-black uppercase text-[10px]">xAI Grok 4.5</SelectItem>
                  <SelectItem value="groq-llama" className="font-black uppercase text-[10px]">Groq Llama 3.3</SelectItem>
                  <SelectItem value="airforce" className="font-black uppercase text-[10px]">Airforce DeepSeek</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Badge variant="outline" className="hidden sm:flex text-black font-black border-black border-2 px-3 py-1 uppercase text-[10px] h-9 items-center">
              <Zap size={10} className="mr-1.5 text-yellow-500 fill-yellow-500" /> Evolution API
            </Badge>
          </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          <aside className={cn(
            "w-full lg:w-80 border-r-2 border-black bg-white flex flex-col shrink-0 overflow-hidden transition-all",
            selectedContact ? "hidden lg:flex" : "flex"
          )}>
            <div className="p-4 border-b-2 border-black bg-[#f8f9fb]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 w-4 h-4" />
                <Input 
                  placeholder="FILTRAR AGENDA..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 border-black border-2 h-10 text-[10px] font-black focus-visible:ring-0 text-black uppercase bg-white rounded-none"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="divide-y-2 divide-black/5">
                {contacts.length > 0 ? contacts.map((contact) => (
                  <button 
                    key={contact.id} 
                    onClick={() => { setSelectedContact(contact); setAiResponse(''); }}
                    className={cn(
                      "w-full p-4 flex items-center gap-3 hover:bg-black group transition-all text-left border-l-4",
                      selectedContact?.id === contact.id ? "bg-black border-l-black" : "bg-white border-l-transparent"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 border-2 border-black flex items-center justify-center shrink-0 transition-colors",
                      selectedContact?.id === contact.id ? "bg-white" : "bg-[#f3f2f2]"
                    )}>
                      <User size={20} className="text-black" />
                    </div>
                    <div className="min-w-0">
                      <p className={cn("text-[11px] font-black uppercase truncate", selectedContact?.id === contact.id ? "text-white" : "text-black")}>{contact.nome}</p>
                      <p className={cn("text-[9px] font-mono", selectedContact?.id === contact.id ? "text-white/60" : "text-black/40")}>{contact.telefone}</p>
                    </div>
                  </button>
                )) : (
                  <div className="p-8 text-center opacity-40">
                    <p className="text-[10px] font-black uppercase italic">Nenhum contato localizado.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </aside>

          <section className={cn(
            "flex-1 bg-[#f3f2f2] flex flex-col overflow-hidden relative",
            !selectedContact ? "hidden lg:flex" : "flex"
          )}>
             {selectedContact ? (
               <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-hidden">
                    <Button variant="ghost" onClick={() => setSelectedContact(null)} className="lg:hidden mb-4 self-start text-black font-black uppercase text-[10px]">
                      <ChevronLeft size={16} className="mr-1" /> Voltar para Agenda
                    </Button>

                    <Card className="flex-1 border-2 border-black rounded-none shadow-[8px_8px_0px_#000] flex flex-col overflow-hidden bg-white">
                       <CardHeader className="bg-black text-white py-3 px-6 flex flex-row items-center justify-between shrink-0">
                          <div className="flex items-center gap-3">
                             <Sparkles size={16} className="text-yellow-400" />
                             <CardTitle className="text-[10px] font-black uppercase tracking-widest">Painel de Atendimento</CardTitle>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                               <Button variant="outline" size="sm" className="h-8 border-white/20 text-white bg-white/10 hover:bg-white/20 text-[9px] font-black uppercase rounded-none">
                                 <BookOpen size={12} className="mr-2" /> Scripts Oficiais
                               </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl h-[80vh] flex flex-col rounded-none border-2 border-black bg-white p-0">
                               <DialogHeader className="p-6 bg-black text-white border-b-2 border-black">
                                 <DialogTitle className="font-black uppercase tracking-widest flex items-center gap-2"><BookOpen size={18}/> Base de Conhecimento</DialogTitle>
                                 <DialogDescription className="text-white/60 text-[10px] uppercase font-bold">Scripts padrão da Get Assessoria Financeira.</DialogDescription>
                               </DialogHeader>
                               <div className="p-4 border-b-2 border-black bg-gray-100 flex gap-2">
                                  <Search className="text-black/40" size={20} />
                                  <Input 
                                    placeholder="BUSCAR SCRIPT..." 
                                    value={scriptSearch}
                                    onChange={(e) => setScriptSearch(e.target.value)}
                                    className="border-none focus-visible:ring-0 bg-transparent font-black uppercase text-[11px]"
                                  />
                               </div>
                               <ScrollArea className="flex-1 p-6">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     {filteredScripts.map((s) => (
                                       <div key={s.id} className="p-4 border-2 border-black hover:bg-black group transition-all cursor-default">
                                          <div className="flex justify-between items-start mb-2">
                                            <Badge className="bg-black text-white group-hover:bg-white group-hover:text-black border-none text-[8px] font-black uppercase rounded-none">{s.cat}</Badge>
                                            <Button variant="ghost" size="icon" onClick={() => handleApplyScript(s.text)} className="h-6 w-6 text-black group-hover:text-white"><Copy size={12}/></Button>
                                          </div>
                                          <h4 className="font-black uppercase text-[10px] mb-2 group-hover:text-white">{s.title}</h4>
                                          <p className="text-[9px] font-bold text-black/60 group-hover:text-white/60 leading-relaxed uppercase">{s.text.substring(0, 150)}...</p>
                                          <Button onClick={() => handleApplyScript(s.text)} className="w-full mt-4 h-8 bg-white text-black border-2 border-black font-black uppercase text-[8px] rounded-none group-hover:bg-primary group-hover:border-primary group-hover:text-black">Aplicar</Button>
                                       </div>
                                     ))}
                                  </div>
                               </ScrollArea>
                            </DialogContent>
                          </Dialog>
                       </CardHeader>
                       
                       <CardContent className="flex-1 flex flex-col p-4 lg:p-6 space-y-4 lg:space-y-6 min-h-0">
                          <Tabs defaultValue="ia" className="flex-1 flex flex-col min-h-0">
                            <TabsList className="bg-gray-100 border-2 border-black rounded-none p-1 shrink-0 h-12">
                              <TabsTrigger value="ia" className="flex-1 font-black uppercase text-[9px] data-[state=active]:bg-black data-[state=active]:text-white rounded-none">IA Estratégica</TabsTrigger>
                              <TabsTrigger value="history" className="flex-1 font-black uppercase text-[9px] data-[state=active]:bg-black data-[state=active]:text-white rounded-none">Análise Tribunal</TabsTrigger>
                            </TabsList>

                            <TabsContent value="ia" className="flex-1 flex flex-col gap-4 mt-4 min-h-0">
                              <div className="grid grid-cols-3 gap-2 lg:gap-3 shrink-0">
                                <Button variant="outline" onClick={() => handleGenerateAI('legal')} disabled={isGenerating} className="h-10 border-2 border-black font-black uppercase text-[9px] hover:bg-black hover:text-white transition-all rounded-none bg-white">
                                  <Scale size={12} className="mr-2 text-blue-600" /> Jurídico
                                </Button>
                                <Button variant="outline" onClick={() => handleGenerateAI('comercial')} disabled={isGenerating} className="h-10 border-2 border-black font-black uppercase text-[9px] hover:bg-black hover:text-white transition-all rounded-none bg-white">
                                  <Sparkles size={12} className="mr-2 text-orange-500" /> Comercial
                                </Button>
                                <Button variant="outline" onClick={() => handleGenerateAI('financeiro')} disabled={isGenerating} className="h-10 border-2 border-black font-black uppercase text-[9px] hover:bg-black hover:text-white transition-all rounded-none bg-white">
                                  <Zap size={12} className="mr-2 text-yellow-500" /> Financeiro
                                </Button>
                              </div>
                              
                              <div className="flex-1 bg-[#f8f9fb] border-2 border-dashed border-black/20 p-4 flex flex-col relative min-h-0">
                                {isGenerating && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 z-10 rounded-none"><Loader2 className="animate-spin text-black" size={32} /><p className="text-[10px] font-black uppercase tracking-[0.2em]">Sincronizando Resposta...</p></div>}
                                <textarea 
                                  value={aiResponse}
                                  onChange={(e) => setAiResponse(e.target.value)}
                                  placeholder="REDIGIR MENSAGEM OU SELECIONAR MODELO..."
                                  className="w-full h-full bg-transparent border-none resize-none text-[11px] lg:text-sm font-black uppercase leading-relaxed text-black focus:ring-0"
                                />
                                {aiResponse && (
                                   <Button variant="ghost" size="icon" onClick={copyToClipboard} className="absolute bottom-2 right-2 h-8 w-8 text-black/40 hover:text-black">
                                      <Copy size={14} />
                                   </Button>
                                )}
                              </div>
                            </TabsContent>

                            <TabsContent value="history" className="flex-1 flex flex-col gap-4 mt-4 min-h-0">
                               <div className="space-y-2 shrink-0">
                                  <Label className="text-[10px] font-black uppercase">Histórico Bruto do Tribunal</Label>
                                  <Textarea 
                                    placeholder="COLE O HISTÓRICO DE MOVIMENTAÇÕES DO SITE DO TRIBUNAL AQUI..." 
                                    value={courtHistory}
                                    onChange={(e) => setCourtHistory(e.target.value)}
                                    className="min-h-[120px] border-2 border-black rounded-none font-black uppercase text-[10px] bg-white"
                                  />
                               </div>
                               <Button onClick={handleGenerateFromHistory} disabled={!courtHistory.trim() || isGenerating} className="w-full bg-black text-white border-2 border-black font-black uppercase h-12 rounded-none shadow-[4px_4px_0px_#22c55e]">
                                  {isGenerating ? <Loader2 className="animate-spin mr-2" size={16} /> : <History size={16} className="mr-2" />}
                                  Analisar Histórico & Redigir Resumo
                               </Button>
                               <div className="flex-1 bg-[#f8f9fb] border-2 border-dashed border-black/20 p-4 min-h-0 relative">
                                  {isGenerating && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 z-10 rounded-none"><Loader2 className="animate-spin text-black" size={32} /><p className="text-[10px] font-black uppercase tracking-[0.2em]">IA Analisando Tribunal...</p></div>}
                                  <textarea 
                                    value={aiResponse}
                                    onChange={(e) => setAiResponse(e.target.value)}
                                    placeholder="O RESULTADO DA ANÁLISE APARECERÁ AQUI..."
                                    className="w-full h-full bg-transparent border-none resize-none text-[11px] lg:text-sm font-black uppercase leading-relaxed text-black focus:ring-0"
                                  />
                               </div>
                            </TabsContent>
                          </Tabs>

                          <div className="flex flex-col sm:flex-row gap-3 shrink-0 pt-4 border-t-2 border-black/5">
                             <Button 
                                disabled={!aiResponse || aiResponse.length < 5 || isSending || isGenerating}
                                onClick={handleSendAPI}
                                className="flex-1 h-12 bg-black text-white border-2 border-black font-black uppercase text-[10px] hover:bg-white hover:text-black transition-all shadow-[4px_4px_0px_#000] hover:shadow-none rounded-none"
                             >
                                {isSending ? <Loader2 className="animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
                                Enviar Evolution API
                             </Button>
                             <Button 
                                asChild
                                variant="outline"
                                className="flex-1 h-12 border-2 border-black font-black uppercase text-[10px] hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_#000] hover:shadow-none rounded-none bg-white"
                             >
                                <a href={formatWhatsAppLink(selectedContact?.telefone || '', aiResponse)} target="_blank" rel="noopener noreferrer">
                                   <MessageCircle size={16} className="mr-2" /> Abrir WhatsApp Manual
                                </a>
                              </Button>
                          </div>
                       </CardContent>
                    </Card>
                 </div>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6 opacity-30">
                  <div className="icon-3d-wrapper">
                    <div className="icon-3d-block black w-20 h-20 rounded-none"><Bot size={48} className="text-white" /></div>
                  </div>
                  <div>
                    <h2 className="text-lg lg:text-2xl font-black uppercase tracking-widest">Aguardando Seleção</h2>
                    <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.3em] mt-2">Escolha um contato para iniciar o atendimento de gabinete.</p>
                  </div>
               </div>
             )}
          </section>

          {selectedContact && (
            <aside className="hidden xl:flex w-96 border-l-2 border-black bg-white flex flex-col shrink-0 overflow-hidden shadow-2xl">
               <div className="p-6 bg-[#f8f9fb] border-b-2 border-black">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40 mb-1">Dossiê de Atendimento</h3>
                  <h2 className="text-lg font-black uppercase leading-tight">{selectedContact.nome}</h2>
               </div>
               
               <ScrollArea className="flex-1 p-6">
                  <div className="space-y-8">
                     <section className="space-y-4">
                        <Label className="text-[9px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5">Contexto Procedural</Label>
                        <div className="space-y-3">
                           <InfoItem icon={<FileText size={12}/>} label="Protocolo CNJ" value={selectedContact.protocolo} />
                           <InfoItem icon={<Clock size={12}/>} label="Status Atual" value={selectedContact.status} />
                           <InfoItem icon={<User size={12}/>} label="Advogado Responsável" value={selectedContact.advogado} />
                        </div>
                     </section>

                     <section className="space-y-4">
                        <Label className="text-[9px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5">Última Observação</Label>
                        <div className="p-4 bg-[#f3f2f2] border-2 border-black rounded-none">
                           <p className="text-[10px] font-black uppercase leading-relaxed text-black/60 italic">
                             {selectedContact.observacao || 'SEM NOTAS REGISTRADAS NO GABINETE.'}
                           </p>
                        </div>
                     </section>
                  </div>
               </ScrollArea>
               <footer className="p-6 border-t-2 border-black bg-[#f8f9fb]">
                  <p className="text-[8px] font-black uppercase text-center text-black/40">Sincronizado v870.0 Elite</p>
               </footer>
            </aside>
          )}
        </div>

        <footer className="h-10 border-t border-[#dddbda] bg-white flex items-center justify-center gap-4 lg:gap-6 text-[8px] lg:text-[10px] text-black/60 font-black uppercase tracking-[0.2em] shrink-0">
          <div className="flex items-center gap-2"><Copyright size={10} /> 2026 W1 Capital.</div>
          <span className="hidden sm:inline uppercase font-black">Relatório Consolidado • FUNDADOR DAVI ALVES FIGUEREDO</span>
        </footer>
      </main>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3">
       <div className="w-7 h-7 bg-[#f3f2f2] border border-black flex items-center justify-center shrink-0">
          {icon}
       </div>
       <div className="min-w-0">
          <p className="text-[8px] font-black text-black/40 uppercase leading-none mb-0.5">{label}</p>
          <p className="text-[10px] font-black text-black uppercase truncate">{value}</p>
       </div>
    </div>
  );
}
