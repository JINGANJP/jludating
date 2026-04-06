import { apiClient } from './client'

export interface QuestionnaireAnswers {
  [questionId: string]: string | string[]
}

export interface QuestionnaireDraft {
  answers: QuestionnaireAnswers
  updatedAt: string | null
}

export const questionnaireApi = {
  getDraft: async (): Promise<QuestionnaireDraft> => {
    const { data } = await apiClient.get<QuestionnaireDraft>('/users/questionnaire')
    return data
  },
  save: async (answers: QuestionnaireAnswers): Promise<{ success: boolean; updatedAt: string }> => {
    const { data } = await apiClient.put('/users/questionnaire', { answers })
    return data
  },
}
