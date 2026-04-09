"use client";

import { useState } from "react";
import { FileText, Printer, Send, UserCheck, ShieldCheck } from "lucide-react";

interface Variable {
  id: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'choice';
}

interface TemplateProps {
  title: string;
  description: string;
  icon: any;
  initialText: string;
  variables: Variable[];
  type: 'whatsapp' | 'print';
}

function DocumentEditor({ title, description, icon: Icon, initialText, variables, type }: TemplateProps) {
  const [vars, setVars] = useState<Record<string, string>>({});
  const [text, setText] = useState(initialText);

  const getPreview = () => {
    let preview = text;
    variables.forEach(v => {
      let val = vars[v.id] || "____";
      if (v.type === 'choice') {
        const isSim = vars[v.id] === 'Sim';
        const isNao = vars[v.id] === 'Não';
        val = `${isSim ? '[X]' : '[ ]'} Sim  ${isNao ? '[X]' : '[ ]'} Não`;
      }
      preview = preview.replaceAll(v.id, val);
    });
    return preview;
  };

  const previewTexto = getPreview();

  const handleAction = () => {
    if (type === 'whatsapp') {
      const formatted = encodeURIComponent(previewTexto);
      window.open(`https://wa.me/?text=${formatted}`, '_blank');
    } else {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${title} - ${vars['NOME_COMPLETO'] || vars['NOME_CLIENTE'] || ''}</title>
              <style>
                body { 
                  font-family: 'Inter', -apple-system, sans-serif; 
                  padding: 40px; 
                  line-height: 1.4; 
                  color: #000;
                  background: #fff;
                  font-size: 11pt;
                }
                .content {
                  white-space: pre-wrap;
                  word-wrap: break-word;
                }
                h1 { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; text-transform: uppercase; font-size: 16pt; text-align: center; }
                @page { margin: 1.5cm; }
                .footer { margin-top: 30px; text-align: center; font-size: 8pt; color: #666; font-style: italic; }
              </style>
            </head>
            <body onload="window.print(); window.close();">
              <h1>${title}</h1>
              <div class="content">${previewTexto}</div>
              <div class="footer">Documento gerado eletronicamente por Heinz Studio</div>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden mb-12 no-print">
      <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <Icon size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Editor Area */}
          <div className="space-y-8 overflow-y-auto max-h-[800px] scrollbar-hide p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {variables.map(v => (
                <div key={v.id} className={v.type === 'choice' ? 'flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100' : (variables.length > 5 ? '' : 'md:col-span-2')}>
                  {v.type === 'choice' ? (
                    <>
                      <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider transition-colors">
                        {v.label}
                      </span>
                      <div className="flex bg-white rounded-lg p-0.5 border border-gray-200 shadow-sm shrink-0">
                        <button 
                          onClick={() => setVars({...vars, [v.id]: 'Sim'})}
                          className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${vars[v.id] === 'Sim' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >SIM</button>
                        <button 
                          onClick={() => setVars({...vars, [v.id]: 'Não'})}
                          className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${vars[v.id] === 'Não' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >NÃO</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <label className="text-[10px] uppercase font-bold text-gray-400 mb-1.5 ml-1 block tracking-widest">
                        {v.label}
                      </label>
                      <input 
                        type="text" 
                        placeholder={v.placeholder || "..."}
                        value={vars[v.id] || ""} 
                        onChange={e => setVars({ ...vars, [v.id]: e.target.value })} 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/30 text-sm font-medium focus:border-primary outline-none transition-all" 
                      />
                    </>
                  )}
                </div>
              ))}
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 mb-1.5 ml-1 block tracking-widest">
                Texto Base (Ajuste Final)
              </label>
              <textarea 
                value={text} 
                onChange={e => setText(e.target.value)} 
                className="w-full h-64 p-5 rounded-[24px] border border-gray-200 bg-white text-sm font-medium text-gray-600 focus:border-primary outline-none transition-all leading-relaxed shadow-inner"
              ></textarea>
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex flex-col h-full sticky top-0">
            <div className="bg-gray-900 rounded-[32px] p-6 md:p-8 flex flex-col h-[600px] lg:h-full shadow-2xl relative overflow-hidden group">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/30 transition-all duration-1000"></div>
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-500">Preview para Impressão</span>
                <div className="flex gap-1">
                  <Printer size={12} className="text-gray-600" />
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-[24px] p-6 md:p-8 text-gray-200 text-xs md:text-sm whitespace-pre-wrap flex-1 overflow-y-auto font-medium leading-relaxed border border-white/10 relative z-10 scrollbar-hide">
                {previewTexto}
              </div>
              
              <button 
                onClick={handleAction}
                className={`mt-6 w-full ${type === 'whatsapp' ? 'bg-[#25D366] hover:bg-[#20ba59]' : 'bg-black hover:bg-gray-800'} text-white font-black py-4.5 rounded-[20px] shadow-xl transition-all flex items-center justify-center gap-3 relative z-10 hover:scale-[1.02] active:scale-[0.98]`}
              >
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  {type === 'whatsapp' ? <Send size={14} className="ml-0.5" /> : <Printer size={16} />}
                </div>
                {type === 'whatsapp' ? 'ENVIAR PELO WHATSAPP' : 'GERAR IMPRESSÃO'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function ContratoPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12 max-w-7xl mx-auto space-y-12">
      
      {/* Header */}
      <div className="max-w-3xl mb-12">
        <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-4">
          Documentos e Termos
        </h2>
        <p className="text-lg text-gray-500 font-medium leading-relaxed">
          Gere termos, contratos e fichas médicas. Preencha as variáveis e envie ou imprima instantaneamente.
        </p>
      </div>

      <div className="space-y-16">
        
        {/* 1. Compromisso Geral */}
        <DocumentEditor 
          title="Compromisso de Sessão"
          description="Termos básicos de agendamento, retoque e cancelamento."
          icon={ShieldCheck}
          type="whatsapp"
          initialText={`Olá NOME_CLIENTE, este é o compromisso do nosso estúdio referente à realização do procedimento: SERVICO_TATTOO no valor de VALOR_SERVICO.

Regras do Estúdio:
1. O cliente tem 60 dias para agendar o retoque gratuito. Após esse prazo, será cobrado.
2. Em caso de falta sem aviso prévio de 24h, o valor do SINAL será perdido para cobrir a agenda travada.
3. Se o estúdio necessitar cancelar ou reagendar pela nossa parte, seu sinal poderá ser devolvido integralmente se não quiser um novo horário.

Aguardamos ansiosamente pela sua sessão!
Assinado: Heinz Tattoo Studio`}
          variables={[
            { id: "NOME_CLIENTE", label: "Nome do Cliente", placeholder: "Ex: João Silva" },
            { id: "SERVICO_TATTOO", label: "Procedimento", placeholder: "Ex: Tatuagem Realista" },
            { id: "VALOR_SERVICO", label: "Valor", placeholder: "Ex: R$ 500,00" },
          ]}
        />

        {/* 2. Autorização de Menores */}
        <DocumentEditor 
          title="Autorização de Menores"
          description="Termo legal para tatuagem em adolescentes com autorização dos pais."
          icon={UserCheck}
          type="print"
          initialText={`TERMO DE AUTORIZAÇÃO DE TATUAGEM
ESTÚDIO: HEINZ TATTOO STUDIO

Eu, NOME_RESPONSAVEL, nascido em NASC_RESPONSAVEL, Idade IDADE_RESPONSAVEL, estado civil ESTADO_CIVIL_RESPONSAVEL, RG RG_RESPONSAVEL, residente e domiciliado à rua ENDERECO_RESPONSAVEL, Bairro BAIRRO_RESPONSAVEL, CEP CEP_RESPONSAVEL, Telefone TEL_RESPONSAVEL, no gozo pleno de minhas faculdades mentais e psíquicas, pelo presente e na melhor forma de direito, autorizo o artista HEINZ TATTOO a executar sobre a pele de meu filho (a) NOME_FILHO, menor de idade, nascido (a) em NASC_FILHO, CIDADE_UF_FILHO, portador do RG RG_FILHO, que em minha companhia reside e pelo qual sou inteiramente responsável, a gravação da tatuagem representada pelo desenho DESENHO, assumo ainda, na qualidade do genitor do menor, plena responsabilidade pela gravação, eximindo de qualquer responsabilidade civil ou criminal o agente elaborador.

Data: DATA_ATUAL

Ass. Do Tatuador: ___________________________________
Ass. Do Menor: ____________________________________
Ass. Do Responsável: ________________________________

* Favor reconhecer firma da assinatura do responsável.`}
          variables={[
            { id: "NOME_RESPONSAVEL", label: "Nome do Responsável" },
            { id: "NASC_RESPONSAVEL", label: "Nascimento do Responsável" },
            { id: "IDADE_RESPONSAVEL", label: "Idade do Responsável" },
            { id: "ESTADO_CIVIL_RESPONSAVEL", label: "Estado Civil" },
            { id: "RG_RESPONSAVEL", label: "RG do Responsável" },
            { id: "ENDERECO_RESPONSAVEL", label: "Endereço Completo" },
            { id: "BAIRRO_RESPONSAVEL", label: "Bairro" },
            { id: "CEP_RESPONSAVEL", label: "CEP" },
            { id: "TEL_RESPONSAVEL", label: "Telefone" },
            { id: "NOME_FILHO", label: "Nome do Menor" },
            { id: "NASC_FILHO", label: "Nascimento do Menor" },
            { id: "RG_FILHO", label: "RG do Menor" },
            { id: "CIDADE_UF_FILHO", label: "Cidade/UF do Menor" },
            { id: "DESENHO", label: "Descrição do Desenho" },
            { id: "DATA_ATUAL", label: "Data de Hoje" },
          ]}
        />

        {/* 3. Ficha de Anamnese */}
        <DocumentEditor 
          title="Ficha de Anamnese"
          description="Histórico de saúde completo e termo de responsabilidade."
          icon={FileText}
          type="print"
          initialText={`FICHA DE ANAMNESE E SAÚDE

DADOS PESSOAIS
Nome completo: NOME_COMPLETO
RG: RG_ANAM CPF: CPF_ANAM Data de nasc.: NASC_ANAM
Endereço: END_ANAM
CEP: CEP_ANAM Cidade: CID_ANAM
E-mail: EMAIL_ANAM
Como nos conheceu: CONHECEU_ANAM WhatsApp: WHATS_ANAM

HISTÓRICO DE SAÚDE
Fumante? FUMANTE_CHECK
Alérgia? ALERGIA_CHECK
Grávida? GRAVIDA_CHECK
Menstruada? MENSTR_CHECK
Possui herpes? HERPES_CHECK
Quelóide? QUELOIDE_CHECK
Diabetes? DIABETES_CHECK
Epilepsia? EPILEPSIA_CHECK
Cicatriza mal? CICATRIZA_CHECK
Anemia? ANEMIA_CHECK
Hemofilia? HEMOFILIA_CHECK
Desmaio? DESMAIO_CHECK
Vitiligo? VITILIGO_CHECK
Portador de HIV? HIV_CHECK
Marcapasso? MARCAPASSO_CHECK
Hepatite? HEPATITE_CHECK
Hipertensão? HIPERTENSAO_CHECK
Doença auto-imune? AUTOIMUNE_CHECK
Alimentou-se nas últimas 24h? ALIM_CHECK
Está sob efeito de drogas/álcool? DROGAS_CHECK
Está com a pele bronzeada? BRONZE_CHECK
Possui alguma doença cardíaca? CARDIACO_CHECK
Possui algum tipo de câncer? CANCER_CHECK
Problema de pele/cicatrização? PELE_CHECK
Medicamente faz uso diário? MEDIC_CHECK
Está em tratamento médico? TRATAM_CHECK
Possui doenças transmissíveis? TRANSM_CHECK
Possui algum problema de saúde não citado? OUTRO_CHECK

TERMO DE RESPONSABILIDADE
Declaro que as informações acima são verdadeiras, não cabendo ao profissional quaisquer responsabilidades por declarações omitidas nessa avaliação. Declaro ter de minha espontânea vontade a realização da tatuagem no local aqui descrito. Estou ciente de que o procedimento poderá ocasionar desconforto, dor e inflamação, sendo necessário seguir todos os cuidados recomendados pelo profissional. Autorizo o registro fotográfico do trabalho realizado (autorizando ou não o uso para divulgação). Estou ciente de que o procedimento não possui garantia absoluta de resultado, podendo haver necessidade de retoques posteriores.

Assinatura do cliente: ______________________________________
Data: DATA_ATUAL_ANAM

PROFISSIONAL
Local da tattoo/piercing: LOCAL_TATTOO Tipo: TIPO_TATTOO
Obs.: OBS_PRO
Profissional: PRO_PRO
Valor: VALOR_PRO`}
          variables={[
            { id: "NOME_COMPLETO", label: "Nome Completo" },
            { id: "RG_ANAM", label: "RG" },
            { id: "CPF_ANAM", label: "CPF" },
            { id: "NASC_ANAM", label: "Nascimento" },
            { id: "END_ANAM", label: "Endereço" },
            { id: "CEP_ANAM", label: "CEP" },
            { id: "CID_ANAM", label: "Cidade" },
            { id: "EMAIL_ANAM", label: "E-mail" },
            { id: "CONHECEU_ANAM", label: "Como conheceu" },
            { id: "WHATS_ANAM", label: "WhatsApp" },
            
            // Checks
            { id: "FUMANTE_CHECK", label: "Fumante?", type: 'choice' },
            { id: "ALERGIA_CHECK", label: "Alergia?", type: 'choice' },
            { id: "GRAVIDA_CHECK", label: "Grávida?", type: 'choice' },
            { id: "MENSTR_CHECK", label: "Menstruada?", type: 'choice' },
            { id: "HERPES_CHECK", label: "Possui herpes?", type: 'choice' },
            { id: "QUELOIDE_CHECK", label: "Quelóide?", type: 'choice' },
            { id: "DIABETES_CHECK", label: "Diabetes?", type: 'choice' },
            { id: "EPILEPSIA_CHECK", label: "Epilepsia?", type: 'choice' },
            { id: "CICATRIZA_CHECK", label: "Cicatriza mal?", type: 'choice' },
            { id: "ANEMIA_CHECK", label: "Anemia?", type: 'choice' },
            { id: "HEMOFILIA_CHECK", label: "Hemofilia?", type: 'choice' },
            { id: "DESMAIO_CHECK", label: "Desmaio?", type: 'choice' },
            { id: "VITILIGO_CHECK", label: "Vitiligo?", type: 'choice' },
            { id: "HIV_CHECK", label: "Portador de HIV?", type: 'choice' },
            { id: "MARCAPASSO_CHECK", label: "Marcapasso?", type: 'choice' },
            { id: "HEPATITE_CHECK", label: "Hepatite?", type: 'choice' },
            { id: "HIPERTENSAO_CHECK", label: "Hipertensão?", type: 'choice' },
            { id: "AUTOIMUNE_CHECK", label: "Doença auto-imune?", type: 'choice' },
            { id: "ALIM_CHECK", label: "Alimentou-se?", type: 'choice' },
            { id: "DROGAS_CHECK", label: "Drogas/Álcool?", type: 'choice' },
            { id: "BRONZE_CHECK", label: "Pele bronzeada?", type: 'choice' },
            { id: "CARDIACO_CHECK", label: "Problema cardíaco?", type: 'choice' },
            { id: "CANCER_CHECK", label: "Algum câncer?", type: 'choice' },
            { id: "PELE_CHECK", label: "Problema de pele?", type: 'choice' },
            { id: "MEDIC_CHECK", label: "Uso diário medic.?", type: 'choice' },
            { id: "TRATAM_CHECK", label: "Tratamento médico?", type: 'choice' },
            { id: "TRANSM_CHECK", label: "D. Transmissíveis?", type: 'choice' },
            { id: "OUTRO_CHECK", label: "Outro problema?", type: 'choice' },

            { id: "DATA_ATUAL_ANAM_ID", label: "Data de Hoje" },
            { id: "LOCAL_TATTOO", label: "Local da Tattoo" },
            { id: "TIPO_TATTOO", label: "Tipo (Fineline, etc)" },
            { id: "OBS_PRO", label: "Observações" },
            { id: "PRO_PRO", label: "Profissional" },
            { id: "VALOR_PRO", label: "Valor" },
          ]}
        />

      </div>
    </div>
  );
}
