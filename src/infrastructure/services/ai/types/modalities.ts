/**
 * AI Modality Types
 *
 * Generic type definitions for different AI modalities:
 * - Text Chat (current)
 * - Image Generation (future)
 * - Text-to-Speech (future)
 *
 * These types enable a plug-and-play architecture where
 * new modalities can be added without changing core infrastructure.
 */

import { AIProviderType } from "@/domain/models";

/**
 * Supported AI modalities
 */
export type AIModality = "text-chat" | "image-generation" | "text-to-speech" | "fairodds";

/**
 * Base request interface for all modalities
 */
export interface BaseAIRequest {
  /** Unique request ID for tracking */
  requestId: string;
  /** User ID if authenticated */
  userId?: string;
  /** Specific provider to use */
  provider?: AIProviderType;
}

/**
 * Base response interface for all modalities
 */
export interface BaseAIResponse {
  /** Request ID for correlation */
  requestId: string;
  /** Provider that handled the request */
  provider: AIProviderType;
  /** Modality type */
  modality: AIModality;
}

/**
 * Interface for streamable responses
 */
export interface StreamableResponse extends BaseAIResponse {
  /** Readable stream of response data */
  stream: ReadableStream;
}

// ============================================
// Text Chat Types
// ============================================

/**
 * Message role in conversation
 */
export type ChatRole = "user" | "assistant" | "system";

/**
 * Single message in conversation
 */
export interface ChatMessageInput {
  role: ChatRole;
  content: string;
}

/**
 * Text chat request
 */
export interface TextChatRequest extends BaseAIRequest {
  /** Conversation messages */
  messages: ChatMessageInput[];
  /** Maximum tokens in response */
  maxTokens?: number;
  /** Temperature for response randomness */
  temperature?: number;
}

/**
 * Text chat response (streaming)
 */
export interface TextChatResponse extends StreamableResponse {
  modality: "text-chat";
}

/**
 * Non-streaming text chat response
 */
export interface TextChatSyncResponse extends BaseAIResponse {
  modality: "text-chat";
  /** Complete response text */
  content: string;
  /** Token usage statistics */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ============================================
// Image Generation Types (Future)
// ============================================

/**
 * Image size options
 */
export type ImageSize = "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792";

/**
 * Image generation request
 */
export interface ImageGenRequest extends BaseAIRequest {
  /** Image generation prompt */
  prompt: string;
  /** Negative prompt (what to avoid) */
  negativePrompt?: string;
  /** Image dimensions */
  size?: ImageSize;
  /** Number of images to generate */
  n?: number;
  /** Image quality */
  quality?: "standard" | "hd";
  /** Output format */
  format?: "url" | "base64";
}

/**
 * Generated image data
 */
export interface GeneratedImage {
  /** Image URL (if format is "url") */
  url?: string;
  /** Base64 encoded image (if format is "base64") */
  base64?: string;
  /** Revised prompt (if model modified it) */
  revisedPrompt?: string;
}

/**
 * Image generation response
 */
export interface ImageGenResponse extends BaseAIResponse {
  modality: "image-generation";
  /** Generated images */
  images: GeneratedImage[];
}

// ============================================
// Text-to-Speech Types (Future)
// ============================================

/**
 * Audio output format
 */
export type AudioFormat = "mp3" | "wav" | "opus" | "aac" | "flac";

/**
 * Voice options (provider-specific)
 */
export interface VoiceOption {
  id: string;
  name: string;
  language: string;
  gender?: "male" | "female" | "neutral";
}

/**
 * Text-to-speech request
 */
export interface TTSRequest extends BaseAIRequest {
  /** Text to convert to speech */
  text: string;
  /** Voice ID to use */
  voice?: string;
  /** Speech speed (0.5 to 2.0) */
  speed?: number;
  /** Output audio format */
  format?: AudioFormat;
  /** Language code */
  language?: string;
}

/**
 * Text-to-speech response (streaming audio)
 */
export interface TTSResponse extends StreamableResponse {
  modality: "text-to-speech";
  /** Audio format of the stream */
  format: AudioFormat;
  /** Duration in seconds (if known) */
  duration?: number;
}

/**
 * Non-streaming TTS response
 */
export interface TTSSyncResponse extends BaseAIResponse {
  modality: "text-to-speech";
  /** Audio data as base64 */
  audio: string;
  /** Audio format */
  format: AudioFormat;
  /** Duration in seconds */
  duration: number;
}

// ============================================
// Streaming Callbacks
// ============================================

/**
 * Callbacks for streaming responses
 */
export interface StreamCallbacks<T = string> {
  /** Called for each chunk of data */
  onData: (data: T) => void;
  /** Called when stream completes */
  onComplete: (fullData: T) => void;
  /** Called on error */
  onError: (error: Error) => void;
}

/**
 * Text streaming callbacks
 */
export type TextStreamCallbacks = StreamCallbacks<string>;

/**
 * Audio streaming callbacks (for TTS)
 */
export type AudioStreamCallbacks = StreamCallbacks<Uint8Array>;
