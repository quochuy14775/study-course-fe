import api from "../lib/axios";

export interface AiMessage {
    role: "user" | "assistant";
    content: string;
}

export interface AiResponseDto {
    response: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    generatedAt: string;
}

export const aiService = {
    sendMessage: async (prompt: string, systemPrompt?: string): Promise<AiResponseDto> => {
        const response = await api.post("/Ai/prompt", { prompt, systemPrompt });
        return response.data;
    },
};
