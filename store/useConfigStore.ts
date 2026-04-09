import { create } from 'zustand';
import { createClient } from '@/lib/supabase';

interface ConfigStore {
  corHexa: string;
  bgHexa: string;
  
  // Templates de Documentos
  templateComprovante: string;
  templateCompromisso: string;
  templateAnamnese: string;
  templateMenores: string;

  carregarConfiguracao: () => Promise<void>;
  salvarConfiguracoes: (updates: Partial<ConfigStore>) => Promise<void>;
}

const DEFAULT_TEMPLATES = {
  templateComprovante: `📍 *Heinz Tattoo Studio - CONFIRMAÇÃO*

Olá *NOME_CLIENTE*, sua sessão foi agendada!

🏁 *Trabalho:* SERVICO_TATTOO
⏳ *Duração estimada:* DURACAO_SESSION
💰 *Valor total:* R$ VALOR_TOTAL
🏠 *Endereço:* Rua Euvira Popia Pavelski 255 Bairro Martelo Caçador S.C

*Por favor, tente chegar 10 minutos antes.*`,

  templateCompromisso: `📝 *REGRAS E COMPROMISSO*

1. O cliente tem 60 dias para agendar o retoque gratuito. Após esse prazo, será cobrado.
2. Em caso de falta sem aviso prévio de 24h, o valor do SINAL será perdido.
3. Se o estúdio necessitar cancelar, seu sinal poderá ser devolvido integralmente.

*Nos vemos na sua sessão!* 🤘✨`,

  templateAnamnese: `FICHA DE ANAMNESE E SAÚDE

DADOS PESSOAIS
Nome completo: NOME_COMPLETO
RG: RG_ANAM CPF: CPF_ANAM Data de nasc.: NASC_ANAM
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
Valor: VALOR_PRO`,

  templateMenores: `TERMO DE AUTORIZAÇÃO DE TATUAGEM
ESTÚDIO: HEINZ TATTOO STUDIO

Eu, NOME_RESPONSAVEL, nascido em NASC_RESPONSAVEL, Idade IDADE_RESPONSAVEL, estado civil ESTADO_CIVIL_RESPONSAVEL, RG RG_RESPONSAVEL, Telefone TEL_RESPONSAVEL, no gozo pleno de minhas faculdades mentais e psíquicas, pelo presente e na melhor forma de direito, autorizo o artista HEINZ TATTOO a executar sobre a pele de meu filho (a) NOME_FILHO, menor de idade, nascido (a) em NASC_FILHO, CIDADE_UF_FILHO, portador do RG RG_FILHO, que em minha companhia reside e pelo qual sou inteiramente responsável, a gravação da tatuagem representada pelo desenho DESENHO, assumo ainda, na qualidade do genitor do menor, plena responsabilidade pela gravação, eximindo de qualquer responsabilidade civil ou criminal o agente elaborador.

Data: DATA_ATUAL

Ass. Do Tatuador: ___________________________________
Ass. Do Menor: ____________________________________
Ass. Do Responsável: ________________________________

* Favor reconhecer firma da assinatura do responsável.`
};

export const useConfigStore = create<ConfigStore>()((set) => ({
  corHexa: 'bg-[#4F46E5]',
  bgHexa: '#F9FAFB',
  ...DEFAULT_TEMPLATES,
  
  carregarConfiguracao: async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data } = await supabase.from('configuracoes').select('*').eq('user_id', userData.user.id).single();
    if (data) {
      set({ 
        corHexa: data.cor_hexa || 'bg-[#4F46E5]',
        bgHexa: data.fundo_hexa || '#F9FAFB',
        templateComprovante: data.template_comprovante || DEFAULT_TEMPLATES.templateComprovante,
        templateCompromisso: data.template_compromisso || DEFAULT_TEMPLATES.templateCompromisso,
        templateAnamnese: data.template_anamnese || DEFAULT_TEMPLATES.templateAnamnese,
        templateMenores: data.template_menores || DEFAULT_TEMPLATES.templateMenores,
      });
    }
  },

  salvarConfiguracoes: async (updates) => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    try {
      // Atualiza localmente o que foi enviado
      set(updates);

      // Pega estado atualizado para o upsert
      const state = useConfigStore.getState();

      const { error } = await supabase.from('configuracoes').upsert({
        user_id: userData.user.id,
        cor_hexa: state.corHexa,
        fundo_hexa: state.bgHexa,
        template_comprovante: state.templateComprovante,
        template_compromisso: state.templateCompromisso,
        template_anamnese: state.templateAnamnese,
        template_menores: state.templateMenores,
      }, { onConflict: 'user_id' });
      
      if (error) throw error;
    } catch (err) {
      console.error("Erro ao salvar configurações:", err);
    }
  }
}));
