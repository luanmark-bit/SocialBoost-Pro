import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getSocialMediaAdvice = async (
  platform: string, 
  contentDescription: string, 
  goal: string
): Promise<string> => {
  if (!apiKey) return "Chave de API ausente. Não é possível gerar conselhos.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Você é um especialista de classe mundial em marketing de mídia social.
        Um usuário precisa de conselhos para uma campanha no ${platform}.
        
        Descrição do Conteúdo: "${contentDescription}"
        Objetivo: "${goal}"

        Forneça 3 dicas curtas e acionáveis para maximizar o engajamento para este conteúdo específico.
        Responda SEMPRE em PORTUGUÊS (Brasil).
        Formate como uma lista com marcadores. Mantenha em menos de 100 palavras.
      `,
    });
    return response.text || "Nenhum conselho gerado.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Falha ao recuperar conselhos da IA neste momento.";
  }
};