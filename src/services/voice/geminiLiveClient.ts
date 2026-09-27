import { apiClient, type LiveTokenResponse } from '../api/apiClient';

export type LiveConnectionState = 'idle' | 'requesting-token' | 'connecting' | 'connected' | 'disconnected' | 'error';

export interface GeminiLiveCallbacks {
  onStateChange?: (state: LiveConnectionState) => void;
  onTranscript?: (text: string, isFinal?: boolean) => void;
  onUserTranscript?: (text: string, isFinal?: boolean) => void;
  onInterimUserTranscript?: (text: string) => void;
  onAssistantTranscript?: (text: string, isFinal?: boolean) => void;
  onAudioChunk?: (chunk: ArrayBuffer | Uint8Array) => void;
  onError?: (message: string) => void;
  onInterrupted?: () => void;
  onTurnStart?: () => void;
  onTurnComplete?: () => void;
  onFunctionCall?: (name: string, args: Record<string, unknown>, callId?: string) => void;
  onToolConfirmationRequest?: (request: {
    name: string;
    args: Record<string, unknown>;
    callId?: string;
    target: string;
    confirm: () => Promise<void> | void;
    cancel: () => void;
  }) => void;
}

export interface GeminiLiveSessionInfo extends LiveTokenResponse {
  sessionId: string;
}

const LIVE_BACKEND_MODEL = 'models/gemini-3.8-live';
const LIVE_MODEL = 'models/gemini-3.8-live';
const OUTPUT_AUDIO_SAMPLE_RATE = 24000;
const INPUT_AUDIO_SAMPLE_RATE = 16000;

class GeminiLiveClient {
  private state: LiveConnectionState = 'idle';
  private socket: WebSocket | null = null;
  private callbacks: GeminiLiveCallbacks = {};
  private currentSessionId: string | null = null;
  private currentModel: string | null = null;
  private token: string | null = null;
  private expiresAt: string | null = null;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private microphoneSource: MediaStreamAudioSourceNode | null = null;
  private microphoneProcessor: ScriptProcessorNode | null = null;
  private playbackSource: AudioBufferSourceNode | null = null;
  private playGain: GainNode | null = null;
  private currentLanguage: 'en' | 'hi' | 'mr' = 'en';
  private reconnectTimer: number | null = null;
  private isExplicitlyDisconnected = false;
  private playbackVersion = 0;
  private setupComplete = false;
  private connectionPromise: Promise<GeminiLiveSessionInfo> | null = null;
  private connectResolver: ((session: GeminiLiveSessionInfo) => void) | null = null;
  private connectRejecter: ((error: unknown) => void) | null = null;
  private queuedAudio: Array<{ chunk: Uint8Array; generation: number }> = [];
  private isPlayingQueuedAudio = false;
  private currentPlaybackGeneration = 0;

  setCallbacks(callbacks: GeminiLiveCallbacks): void {
    this.callbacks = callbacks;
  }

  getConnectionState(): LiveConnectionState {
    return this.state;
  }

  getSessionInfo(): Pick<GeminiLiveSessionInfo, 'model' | 'sessionId' | 'expiresAt'> | null {
    if (!this.currentSessionId || !this.currentModel) {
      return null;
    }

    return {
      model: this.currentModel,
      sessionId: this.currentSessionId,
      expiresAt: this.expiresAt,
    };
  }

  setLanguage(language: 'en' | 'hi' | 'mr'): void {
    this.currentLanguage = language;
  }

  async requestToken(sessionId?: string, model?: string): Promise<GeminiLiveSessionInfo> {
    this.state = 'requesting-token';
    this.callbacks.onStateChange?.(this.state);

    const response = await apiClient.requestLiveToken({
      sessionId: sessionId ?? this.currentSessionId ?? `niva-${Date.now()}`,
      model: model ?? this.currentModel ?? LIVE_BACKEND_MODEL,
    });

    this.currentSessionId = response.sessionId ?? sessionId ?? `niva-${Date.now()}`;
    this.currentModel = response.model || model || LIVE_BACKEND_MODEL;
    this.token = response.token;
    this.expiresAt = response.expiresAt ?? null;

    this.state = 'idle';
    this.callbacks.onStateChange?.(this.state);

    return {
      ...response,
      sessionId: this.currentSessionId,
      model: this.currentModel,
    };
  }

  async connect(sessionId?: string, model?: string, language: 'en' | 'hi' | 'mr' = 'en'): Promise<GeminiLiveSessionInfo> {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      this.currentLanguage = language;
      if (this.connectionPromise) {
        return await this.connectionPromise;
      }
      return {
        token: this.token ?? '',
        expiresAt: this.expiresAt,
        model: this.currentModel ?? model ?? LIVE_BACKEND_MODEL,
        sessionId: this.currentSessionId ?? sessionId ?? `niva-${Date.now()}`,
        provider: 'google-gemini',
      };
    }

    this.isExplicitlyDisconnected = false;
    this.state = 'connecting';
    this.callbacks.onStateChange?.(this.state);
    this.currentLanguage = language;
    this.setupComplete = false;

    try {
      const sessionInfo = await this.requestToken(sessionId, model ?? this.currentModel ?? LIVE_BACKEND_MODEL);
      if (!this.token) {
        throw new Error('Live token missing from the backend response.');
      }

      const liveUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(this.token)}`;

      this.connectionPromise = new Promise<GeminiLiveSessionInfo>((resolve, reject) => {
        this.connectResolver = resolve;
        this.connectRejecter = reject;
this.socket = new WebSocket(liveUrl);

// Gemini Live can deliver JSON messages as binary WebSocket frames.
this.socket.binaryType = 'arraybuffer';

this.socket.onopen = () => {
  this.clearReconnectTimer();
  this.state = 'connected';
  this.callbacks.onStateChange?.(this.state);
  this.sendSetup();
};

this.socket.onmessage = async (event) => {
  try {
    let rawMessage: string;

    if (typeof event.data === 'string') {
      rawMessage = event.data;
    } else if (event.data instanceof ArrayBuffer) {
      rawMessage = new TextDecoder().decode(event.data);
    } else if (event.data instanceof Blob) {
      rawMessage = await event.data.text();
    } else {
      throw new Error('Unsupported Gemini Live WebSocket message type.');
    }

    this.handleSocketMessage(rawMessage);
  } catch (error) {
    console.error('Gemini Live message processing error:', error);

    this.callbacks.onError?.(
      error instanceof Error
        ? error.message
        : 'Failed to process Gemini Live message.',
    );
  }
};

        this.socket.onerror = () => {
          this.state = 'error';
          this.callbacks.onStateChange?.(this.state);
          this.callbacks.onError?.('Unable to establish the Gemini Live connection. The token may be expired or invalid.');
          this.connectRejecter?.(new Error('Unable to establish the Gemini Live connection.'));
          this.connectResolver = null;
          this.connectRejecter = null;
          this.connectionPromise = null;
        };

        this.socket.onclose = (event) => {
          this.socket = null;
          this.state = 'disconnected';
          this.callbacks.onStateChange?.(this.state);

          if (event.code === 1008 || event.code === 1011) {
            this.callbacks.onError?.('The Gemini Live session expired or the token was rejected.');
          }

          if (!this.isExplicitlyDisconnected) {
            this.scheduleReconnect();
          }

          this.setupComplete = false;
          if (this.connectRejecter && this.connectionPromise) {
            this.connectRejecter(new Error('Gemini Live WebSocket closed before setup completed.'));
          }
          this.connectResolver = null;
          this.connectRejecter = null;
          this.connectionPromise = null;
        };
      });

      return await this.connectionPromise;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to connect to Gemini Live.';
      this.state = 'error';
      this.callbacks.onStateChange?.(this.state);
      this.callbacks.onError?.(message);
      throw error;
    }
  }

  async startMicrophone(): Promise<void> {
    if (!this.setupComplete) {
      throw new Error('Gemini Live setup is not complete yet.');
    }

    if (!window.isSecureContext) {
  throw new Error(
    'Microphone access requires a secure HTTPS connection on mobile.'
  );
  }
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('This browser does not support microphone capture.');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      this.mediaStream = stream;

      const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) {
        throw new Error('Web Audio is not available in this browser.');
      }

      const audioContext = new AudioCtor();

if (audioContext.state === 'suspended') {
  await audioContext.resume();
}

this.audioContext = audioContext;

const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(2048, 1, 1);
      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0;

      source.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(audioContext.destination);

      this.microphoneSource = source;
      this.microphoneProcessor = processor;

      processor.onaudioprocess = (event) => {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
          return;
        }

        const input = event.inputBuffer.getChannelData(0);
        const resampled = this.resampleTo16k(input, audioContext.sampleRate || 48000);
        const pcm = this.floatToInt16LittleEndian(resampled);
        const base64 = this.base64Encode(pcm);

        this.socket.send(JSON.stringify({
          realtimeInput: {
            audio: {
              mimeType: 'audio/pcm;rate=16000',
              data: base64,
            },
          },
        }));
      };
    } catch (error) {
      const message = error instanceof DOMException && error.name === 'NotAllowedError'
        ? 'Microphone access was denied.'
        : error instanceof Error
          ? error.message
          : 'Unable to access the microphone.';
      this.callbacks.onError?.(message);
      throw error;
    }
  }

  stopMicrophone(): void {
    if (this.microphoneProcessor) {
      this.microphoneProcessor.disconnect();
      this.microphoneProcessor.onaudioprocess = null;
      this.microphoneProcessor = null;
    }
    if (this.microphoneSource) {
      this.microphoneSource.disconnect();
      this.microphoneSource = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }
  }

  interruptGeneration(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.stopPlayback();
      this.callbacks.onInterrupted?.();
    }
  }

  private invalidatePlaybackGeneration(): void {
    this.currentPlaybackGeneration += 1;
    this.playbackVersion += 1;
    this.queuedAudio = [];
    this.isPlayingQueuedAudio = false;
  }

  stopPlayback(): void {
  this.invalidatePlaybackGeneration();

  if (this.playbackSource) {
    try {
      this.playbackSource.stop();
    } catch {
      // no-op
    }

    this.playbackSource = null;
  }

  if (this.playGain) {
    this.playGain.gain.value = 0;
    this.playGain.disconnect();
    this.playGain = null;
  }
}

  disconnect(): void {
    this.isExplicitlyDisconnected = true;
    this.clearReconnectTimer();
    this.stopPlayback();
    this.stopMicrophone();
    if (this.socket) {
      try {
        this.socket.close();
      } catch {
        // no-op
      }
      this.socket = null;
    }
    this.state = 'disconnected';
    this.callbacks.onStateChange?.(this.state);
  }

  sendToolResponse(name: string, response: Record<string, unknown>, callId?: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(JSON.stringify({
      toolResponse: {
        functionResponses: [{
          id: callId ?? `${name}-response`,
          name,
          response,
        }],
      },
    }));
  }

 private getTranscriptionConfig(): { languageCodes: string[] } {
  const languageMap: Record<'en' | 'hi' | 'mr', string> = {
    en: 'en-US',
    hi: 'hi-IN',
    mr: 'mr-IN',
  };

  const languageCode = languageMap[this.currentLanguage] ?? 'en-US';

  return {
    languageCodes: [languageCode],
  };
}

  private getLiveToolDeclarations(): Array<{ functionDeclarations: Array<Record<string, unknown>> }> {
    return [{
      functionDeclarations: [
        {
          name: 'calculator',
          description: 'Evaluate a math expression using the existing NIVA calculator tool.',
          parameters: {
            type: 'OBJECT',
            properties: {
              expression: { type: 'STRING', description: 'A valid arithmetic expression to evaluate.' },
            },
            required: ['expression'],
          },
        },
        {
          name: 'current_time',
          description: 'Return the current date and time in ISO format.',
          parameters: {
            type: 'OBJECT',
            properties: {},
          },
        },
        {
         
  name: 'open_website',
  description:
    'Open an allowlisted website for the user. MUST be called when the user directly asks NIVA to open, launch, or go to a supported website such as YouTube, Instagram, or Google. Do not tell the user to open the website themselves when this tool can perform the action.',
          parameters: {
            type: 'OBJECT',
            properties: {
              url: { type: 'STRING', description: 'The full URL to open, using http or https.' },
            },
            required: ['url'],
          },
        },
        {
          name: 'web_search',
          description: 'Search the web for a user query using the existing Google search tool.',
          parameters: {
            type: 'OBJECT',
            properties: {
              query: { type: 'STRING', description: 'The search query to run.' },
            },
            required: ['query'],
          },
        },
        {
          name: 'youtube_search',
          description: 'Search YouTube for videos matching a user query using the existing YouTube search tool.',
          parameters: {
            type: 'OBJECT',
            properties: {
              query: { type: 'STRING', description: 'The YouTube search query.' },
            },
            required: ['query'],
          },
        },
      ],
    }];
  }

  private sendSetup(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

   const languageText = {
  en: `
You are NIVA, a voice-first AI assistant.

Always respond in English unless the user explicitly asks for Hindi or Marathi.
Never switch to another language automatically.

You have access to tools that can perform actions for the user.
When the user directly asks you to open a website, use the open_website tool.
Do not tell the user to open the website themselves when the open_website tool can perform the action.

Examples:
- "Open YouTube" → call open_website with https://www.youtube.com
- "Open Instagram" → call open_website with https://www.instagram.com
- "Open Google" → call open_website with https://www.google.com

For direct website-opening requests, perform the tool call first and then briefly tell the user what you did.
Never claim that you cannot open an allowed website when the open_website tool is available.

Keep spoken responses concise, conversational, helpful, and safe.
`,
  hi: `
आप NIVA हैं, एक voice-first AI assistant.

जब तक उपयोगकर्ता स्पष्ट रूप से अंग्रेज़ी या मराठी न मांगे, हमेशा हिंदी में उत्तर दें।
अपने आप किसी दूसरी भाषा में switch न करें।

जब उपयोगकर्ता किसी वेबसाइट को खोलने के लिए कहे, तो open_website tool का उपयोग करें।
जब tool यह काम कर सकता है, तब उपयोगकर्ता को वेबसाइट स्वयं खोलने के लिए न कहें।

उदाहरण:
- "YouTube खोलो" → open_website के साथ https://www.youtube.com
- "Instagram खोलो" → open_website के साथ https://www.instagram.com
- "Google खोलो" → open_website के साथ https://www.google.com

उत्तर संक्षिप्त, उपयोगी और सुरक्षित रखें।
`,
  mr: `
तुम्ही NIVA आहात, एक voice-first AI assistant.

जोपर्यंत वापरकर्ता स्पष्टपणे इंग्रजी किंवा हिंदीची मागणी करत नाही, तोपर्यंत मराठीत उत्तर द्या.
आपोआप दुसऱ्या भाषेत switch करू नका.

वापरकर्त्याने वेबसाइट उघडण्यास सांगितल्यास open_website tool वापरा.
Tool हे काम करू शकत असताना वापरकर्त्याला वेबसाइट स्वतः उघडण्यास सांगू नका.

उदाहरण:
- "YouTube उघड" → open_website सह https://www.youtube.com
- "Instagram उघड" → open_website सह https://www.instagram.com
- "Google उघड" → open_website सह https://www.google.com

उत्तर संक्षिप्त, उपयुक्त आणि सुरक्षित ठेवा.
`,
}[this.currentLanguage] ?? 'Speak in English.';

    const inputAudioTranscription = this.getTranscriptionConfig();
    const outputAudioTranscription = this.getTranscriptionConfig();

    this.socket.send(JSON.stringify({
      setup: {
        model: LIVE_MODEL,
        tools: this.getLiveToolDeclarations(),
        generationConfig: {
          responseModalities: ['AUDIO'],
          temperature: 0.2,
        },
        inputAudioTranscription: Object.keys(inputAudioTranscription).length ? inputAudioTranscription : {},
        outputAudioTranscription: Object.keys(outputAudioTranscription).length ? outputAudioTranscription : {},
        systemInstruction: {
          parts: [{
            text: languageText,
          }],
        },
      },
    }));
  }

private handleSocketMessage(rawMessage: string): void {
  try {
    const payload = JSON.parse(rawMessage);

    const content =
      payload?.serverContent ??
      payload?.server_content ??
      null;

    // ---------------------------------------
    // Setup complete
    // ---------------------------------------
    if (payload?.setupComplete || payload?.setup_complete) {
      this.setupComplete = true;

      if (this.connectResolver) {
        this.connectResolver({
          token: this.token ?? '',
          expiresAt: this.expiresAt,
          model: this.currentModel ?? LIVE_BACKEND_MODEL,
          sessionId: this.currentSessionId ?? `niva-${Date.now()}`,
          provider: 'google-gemini',
        });

        this.connectResolver = null;
        this.connectRejecter = null;
        this.connectionPromise = null;
      }

      return;
    }

    // ---------------------------------------
    // Tool calls
    // IMPORTANT:
    // Gemini Live sends tool calls as a
    // top-level toolCall message.
    // ---------------------------------------
    const functionCalls = payload?.toolCall?.functionCalls;

    if (Array.isArray(functionCalls)) {
      for (const call of functionCalls) {
        const name =
          typeof call?.name === 'string'
            ? call.name
            : '';

        const args =
          call?.args &&
          typeof call.args === 'object'
            ? call.args
            : {};

        const callId =
          typeof call?.id === 'string'
            ? call.id
            : undefined;

        this.callbacks.onFunctionCall?.(
          name,
          args as Record<string, unknown>,
          callId,
        );
      }
    }

    // ---------------------------------------
    // Tool-call cancellation
    // ---------------------------------------
    const cancelledToolIds =
      payload?.toolCallCancellation?.ids ??
      payload?.tool_call_cancellation?.ids;

    if (Array.isArray(cancelledToolIds) && cancelledToolIds.length > 0) {
      console.debug(
        'Gemini Live tool calls cancelled:',
        cancelledToolIds,
      );
    }

    // ---------------------------------------
    // Server interruption
    // ---------------------------------------
    if (content?.interrupted) {
      this.stopPlayback();
      this.callbacks.onInterrupted?.();
      return;
    }

    // ---------------------------------------
    // Turn start
    // ---------------------------------------
    if (
      payload?.event === 'turn_start' ||
      payload?.turnStart ||
      content?.turnStart
    ) {
      this.invalidatePlaybackGeneration();
      this.callbacks.onTurnStart?.();
    }

    // ---------------------------------------
    // User transcription
    // ---------------------------------------
    const inputText = this.readTranscriptText(
      payload,
      ['inputTranscription', 'input_transcription'],
    );

    if (inputText.trim()) {
      this.callbacks.onUserTranscript?.(
        inputText,
        true,
      );
    }

    // ---------------------------------------
    // Interim user transcription
    // ---------------------------------------
    const interimInputText =
      this.readTranscriptText(
        payload,
        [
          'interimInputTranscription',
          'interim_input_transcription',
        ],
      );

    if (interimInputText.trim()) {
      this.callbacks.onInterimUserTranscript?.(
        interimInputText,
      );
    }

    // ---------------------------------------
    // Assistant transcription
    // ---------------------------------------
    const outputText = this.readTranscriptText(
      payload,
      ['outputTranscription', 'output_transcription'],
    );

    if (outputText.trim()) {
      this.callbacks.onAssistantTranscript?.(
        outputText,
        true,
      );
    }

    // ---------------------------------------
    // Model audio
    // ---------------------------------------
    const modelTurnParts =
      content?.modelTurn?.parts ?? [];

    for (const part of modelTurnParts) {
      const audioData =
        part?.inlineData?.data ??
        part?.inline_data?.data ??
        '';

      if (audioData) {
        const decoded =
          this.base64Decode(audioData);

        this.callbacks.onAudioChunk?.(decoded);

        this.queueDecodedAudio(decoded);
      }
    }

    // ---------------------------------------
    // Turn complete
    // ---------------------------------------
    if (
      payload?.event === 'turn_complete' ||
      payload?.turnComplete ||
      content?.turnComplete
    ) {
      this.callbacks.onTurnComplete?.();
    }
  } catch {
    this.callbacks.onError?.(
      'Received an unexpected Live message payload.',
    );
  }
}

  private readTranscriptText(payload: any, keys: string[]): string {
    for (const key of keys) {
      const value = payload?.[key]?.text ?? payload?.[key]?.transcript ?? '';
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
      const nested = payload?.serverContent?.[key]?.text ?? payload?.server_content?.[key]?.text ?? '';
      if (typeof nested === 'string' && nested.trim()) {
        return nested;
      }
    }
    return '';
  }

  private resampleTo16k(input: Float32Array, sourceSampleRate: number): Float32Array {
    if (sourceSampleRate <= 0 || sourceSampleRate === INPUT_AUDIO_SAMPLE_RATE) {
      return input;
    }

    const outputLength = Math.max(1, Math.ceil(input.length * (INPUT_AUDIO_SAMPLE_RATE / sourceSampleRate)));
    const output = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i += 1) {
      const position = (i / Math.max(1, outputLength - 1)) * (input.length - 1);
      const index = Math.floor(position);
      const nextIndex = Math.min(index + 1, input.length - 1);
      const fraction = position - index;
      const current = input[index] ?? 0;
      const next = input[nextIndex] ?? 0;
      output[i] = current + (next - current) * fraction;
    }

    return output;
  }

  private floatToInt16LittleEndian(input: Float32Array): Uint8Array {
    const output = new Uint8Array(input.length * 2);
    const view = new DataView(output.buffer);

    for (let i = 0; i < input.length; i += 1) {
      const sample = Math.max(-1, Math.min(1, input[i]));
      const int16 = sample >= 0 ? sample * 0x7fff : sample * 0x8000;
      view.setInt16(i * 2, int16, true);
    }

    return output;
  }

  private base64Encode(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64Decode(raw: string): Uint8Array {
    const binary = atob(raw);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  private queueDecodedAudio(chunk: Uint8Array): void {
    if (!chunk.length || !this.audioContext) {
      return;
    }

    this.queuedAudio.push({ chunk, generation: this.currentPlaybackGeneration });
    void this.playQueuedAudio();
  }

  private async playQueuedAudio(): Promise<void> {
    if (this.isPlayingQueuedAudio) {
      return;
    }

    this.isPlayingQueuedAudio = true;

    try {
      while (this.queuedAudio.length > 0) {
        const queuedItem = this.queuedAudio.shift();
        if (!queuedItem || !this.audioContext) {
          break;
        }

        const { chunk, generation } = queuedItem;
        if (generation !== this.currentPlaybackGeneration) {
          continue;
        }

        const view = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
        const samples = new Float32Array(chunk.length / 2);

        for (let i = 0; i < samples.length; i += 1) {
          const sample = view.getInt16(i * 2, true);
          samples[i] = sample / 32768;
        }

        const audioBuffer = this.audioContext.createBuffer(1, samples.length, OUTPUT_AUDIO_SAMPLE_RATE);
        audioBuffer.copyToChannel(samples, 0);

        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 1;
        this.playGain = gainNode;

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        await new Promise<void>((resolve) => {
          source.onended = () => {
            if (this.playbackSource === source) {
              this.playbackSource = null;
            }
            if (this.playGain === gainNode) {
              this.playGain = null;
            }
            resolve();
          };

          this.playbackSource = source;
          if (generation !== this.currentPlaybackGeneration) {
            resolve();
            return;
          }
          source.start();
        });

        if (generation !== this.currentPlaybackGeneration) {
          continue;
        }
      }
    } finally {
      this.isPlayingQueuedAudio = false;
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null || this.isExplicitlyDisconnected) {
      return;
    }

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isExplicitlyDisconnected) {
        void this.connect(this.currentSessionId ?? undefined, this.currentModel ?? LIVE_BACKEND_MODEL, this.currentLanguage);
      }
    }, 1500);
  }
}

export const geminiLiveClient = new GeminiLiveClient();
