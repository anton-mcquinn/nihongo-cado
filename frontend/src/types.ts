export interface ReviewLog {
  status: string;
  ease_factor: number;
  interval: number;
  consecutive_correct: number;
  next_review: string;
}

export interface Card {
  id: number;
  front: string;
  back: string;
  notes: string;
  romaji: string;
  part_of_speech: string;
  tags: string;
  audio_url: string;
  source_id: number | null;
  created_at: string;
  review_log?: ReviewLog;
}

export interface Source {
  id: number;
  name: string;
  source_type: string;
  uploaded_at: string | null;
}

export interface CardCreatePayload {
  front: string;
  back: string;
  notes?: string;
  romaji?: string;
  part_of_speech?: string;
  tags?: string;
  audio_url?: string;
  source_id?: number;
}

export interface ExtractedVocab {
  front: string;
  back: string;
  romaji: string;
  part_of_speech: string;
  notes: string;
  already_known: boolean;
}

export interface ExtractVocabResponse {
  words: ExtractedVocab[];
  source_text_preview: string;
}

export interface UserSettings {
  anthropic_api_key_set: boolean;
  daily_new_limit: number;
}
