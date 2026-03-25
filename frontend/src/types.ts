export type JobStatusState =
  | 'pending'
  | 'running'
  | 'awaiting_2fa'
  | 'failed'
  | 'completed'
  | 'stopped';

export interface SortConfigPayload {
  apple_id: string;
  apple_password: string;
  llm_api_base?: string | null;
  llm_api_key?: string | null;
  model: string;
  dry_run: boolean;
  target_root: string;
  max_pdf_pages: number;
  max_bytes_to_read: number;
  file_types: string[];
  use_ocr: boolean;
  ocr_engine?: string | null;
  deep_analysis: boolean;
  request_timeout: number;
}

export interface JobStatusPayload {
  job_id: string;
  status: JobStatusState;
  logs: string[];
  processed_files: number;
  seen_items: number;
  awaiting_two_factor: boolean;
  created_at: string;
  updated_at: string;
  error?: string | null;
}

export interface LoginResponsePayload {
  success: boolean;
  two_factor_required: boolean;
  trusted_session: boolean;
  message: string;
}

export interface DefaultsResponsePayload {
  default_config: SortConfigPayload;
  available_ocr_engines: string[];
  supports_easyocr: boolean;
  supports_tesseract: boolean;
  default_file_types: string[];
}

export interface LlmModelsResponse {
  models: string[];
}

