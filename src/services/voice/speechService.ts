import { AssistantState, SupportedLanguage, ToolType } from '../../types/assistant';
import { actionSafetyService } from '../security/actionSafetyService';
import { toolExecutor } from '../tools/toolExecutor';
import { geminiLiveClient } from './geminiLiveClient';

export interface SpeechCallbacks {
  onStateChange: (state: AssistantState) => void;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onUserTranscript?: (text: string, isFinal: boolean) => void;
  onInterimUserTranscript?: (text: string) => void;
  onAssistantTranscript?: (text: string, isFinal: boolean) => void;
  onError: (errorMsg: string) => void;
  onAudioLevel?: (level: number) => void;
  onToolConfirmationRequest?: (request: {
    name: string;
    args: Record<string, unknown>;
    callId?: string;
    target: string;
    confirm: () => Promise<void> | void;
    cancel: () => void;
  }) => void;
}

class SpeechService {
  private isListening = false;
  private isSpeaking = false;
  private currentLanguage: SupportedLanguage = 'en';
  private autoSpeak = true;
  private bargeInEnabled = true;
  private callbacks: SpeechCallbacks | null = null;

  constructor() {
    geminiLiveClient.setCallbacks({
      onStateChange: (state) => {
        const mappedState: AssistantState = state === 'connected' ? 'listening'
          : state === 'connecting' || state === 'requesting-token' ? 'connecting'
          : state === 'disconnected' ? 'idle'
          : state === 'error' ? 'error'
          : 'idle';

        this.callbacks?.onStateChange(mappedState);
        this.isListening = state === 'connected';
        if (state === 'connected') {
          this.callbacks?.onAudioLevel?.(0.25);
        }
        if (state === 'disconnected' || state === 'error') {
          this.isListening = false;
          this.isSpeaking = false;
          this.callbacks?.onAudioLevel?.(0);
        }
      },
      onUserTranscript: (text, isFinal) => {
        this.callbacks?.onUserTranscript?.(text, Boolean(isFinal));
        this.callbacks?.onTranscript?.(text, Boolean(isFinal));
      },
      onInterimUserTranscript: (text) => {
        this.callbacks?.onInterimUserTranscript?.(text);
      },
      onAssistantTranscript: (text, isFinal) => {
        this.callbacks?.onAssistantTranscript?.(text, Boolean(isFinal));
      },
      onAudioChunk: () => {
        this.isSpeaking = true;
        this.callbacks?.onStateChange('speaking');
        this.callbacks?.onAudioLevel?.(0.8);
      },
      onToolConfirmationRequest: (request: {
        name: string;
        args: Record<string, unknown>;
        callId?: string;
        target: string;
        confirm: () => Promise<void> | void;
        cancel: () => void;
      }) => {
        this.callbacks?.onToolConfirmationRequest?.(request);
      },
      onError: (message) => {
        this.isListening = false;
        this.isSpeaking = false;
        this.callbacks?.onError(message);
        this.callbacks?.onStateChange('error');
      },
      onInterrupted: () => {
        this.isSpeaking = false;
        this.callbacks?.onAudioLevel?.(0);
        this.callbacks?.onStateChange('interrupted');
      },
      onTurnStart: () => {
        this.isListening = true;
        this.callbacks?.onStateChange('listening');
      },
      onTurnComplete: () => {
        this.isListening = false;
        this.isSpeaking = false;
        this.callbacks?.onAudioLevel?.(0);
        this.callbacks?.onStateChange('idle');
      },
      onFunctionCall: (name, args, callId) => {
        void this.handleFunctionCall(name, args, callId);
      },
    });
  }

  public setCallbacks(cbs: SpeechCallbacks) {
    this.callbacks = cbs;
  }

  public async setLanguage(lang: SupportedLanguage): Promise<void> {
  this.currentLanguage = lang;
  await geminiLiveClient.setLanguage(lang);
}
  public setPreferences(autoSpeak: boolean, bargeIn: boolean) {
    this.autoSpeak = autoSpeak;
    this.bargeInEnabled = bargeIn;
  }

  public async startListening(): Promise<boolean> {
    if (this.isListening) {
      return true;
    }

    if (this.isSpeaking && this.bargeInEnabled) {
      this.interrupt();
    }

    try {
      await geminiLiveClient.connect(undefined, undefined, this.currentLanguage);
      await geminiLiveClient.startMicrophone();
      this.isListening = true;
      this.callbacks?.onStateChange('listening');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to access the microphone.';
      this.isListening = false;
      this.callbacks?.onError(message);
      this.callbacks?.onStateChange('idle');
      return false;
    }
  }

  public stopListening() {
    this.isListening = false;
    geminiLiveClient.stopPlayback();
    geminiLiveClient.stopMicrophone();
    this.callbacks?.onAudioLevel?.(0);
    this.callbacks?.onStateChange('idle');
  }

  public simulateVoiceInput(customPrompt?: string) {
    const prompts = {
      en: customPrompt || 'Help me plan the next step clearly',
      hi: customPrompt || 'अगला कदम साफ़ से समझाइए',
      mr: customPrompt || 'पुढील पायरा स्पष्ट सांगा',
    };

    const targetText = prompts[this.currentLanguage] || prompts.en;
    this.callbacks?.onStateChange('listening');
    this.isListening = true;

    let charIndex = 0;
    const typeInterval = setInterval(() => {
      charIndex += 2;
      const partial = targetText.slice(0, charIndex);
      this.callbacks?.onTranscript?.(partial, charIndex >= targetText.length);
      if (charIndex >= targetText.length) {
        clearInterval(typeInterval);
        this.isListening = false;
        this.callbacks?.onStateChange('idle');
      }
    }, 45);
  }

  public speak(text: string, voiceId?: string): Promise<void> {
  if (!this.autoSpeak || this.isListening || this.isSpeaking) {
  return Promise.resolve();
}

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.02;
      utterance.pitch = 1.0;
      utterance.lang = this.currentLanguage === 'hi' ? 'hi-IN' : this.currentLanguage === 'mr' ? 'mr-IN' : 'en-US';

      const voices = window.speechSynthesis.getVoices();
      if (this.currentLanguage === 'hi') {
        const match = voices.find((v) => v.lang.toLowerCase().includes('hi'));
        if (match) utterance.voice = match;
      } else if (this.currentLanguage === 'mr') {
        const match = voices.find((v) => v.lang.toLowerCase().includes('mr') || v.lang.toLowerCase().includes('hi'));
        if (match) utterance.voice = match;
      }

      this.isSpeaking = true;
      this.callbacks?.onStateChange('speaking');

      utterance.onend = () => {
        this.isSpeaking = false;
        this.callbacks?.onAudioLevel?.(0);
        this.callbacks?.onStateChange('idle');
        resolve();
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        this.callbacks?.onAudioLevel?.(0);
        this.callbacks?.onStateChange('idle');
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  public interrupt() {
    this.isSpeaking = false;
    geminiLiveClient.stopPlayback();
    geminiLiveClient.interruptGeneration();
    this.callbacks?.onAudioLevel?.(0);
    this.callbacks?.onStateChange('interrupted');
    setTimeout(() => {
      this.callbacks?.onStateChange('idle');
    }, 700);
  }

  private async handleFunctionCall(name: string, args: Record<string, unknown>, callId?: string): Promise<void> {
    const functionName = name.trim();
    if (!functionName || !/^[a-z0-9_]+$/i.test(functionName)) {
      geminiLiveClient.sendToolResponse(functionName || 'unknown_tool', { error: 'The Live function name is invalid.' }, callId);
      return;
    }

    const normalizedArgs = { ...(args ?? {}) } as Record<string, any>;

    if (functionName === 'current_time') {
      const now = new Date();
      geminiLiveClient.sendToolResponse(functionName, {
        timestamp: now.toISOString(),
        formatted: now.toLocaleString(this.currentLanguage === 'hi' ? 'hi-IN' : this.currentLanguage === 'mr' ? 'mr-IN' : 'en-US'),
      }, callId);
      return;
    }

    let toolType: ToolType | null = null;
    if (functionName === 'calculator') {
      toolType = 'calculator';
      if (!normalizedArgs.expression && typeof normalizedArgs.query === 'string') {
        normalizedArgs.expression = normalizedArgs.query;
      }
    } else if (functionName === 'open_website') {
      toolType = 'browser_open';
      if (!normalizedArgs.url && typeof normalizedArgs.target === 'string') {
        normalizedArgs.url = normalizedArgs.target;
      }
    } else if (functionName === 'web_search' || functionName === 'youtube_search') {
      toolType = 'web_search';
      normalizedArgs.toolName = functionName;
      if (!normalizedArgs.query && typeof normalizedArgs.search === 'string') {
        normalizedArgs.query = normalizedArgs.search;
      }
    }

    if (!toolType) {
      geminiLiveClient.sendToolResponse(functionName, { error: `Tool '${functionName}' is not supported by the current NIVA tool layer.` }, callId);
      return;
    }

    const shouldAutoConfirm = functionName === 'open_website' && typeof normalizedArgs.url === 'string'
      ? actionSafetyService.isDomainAllowed(normalizedArgs.url) && !actionSafetyService.getConfig().confirmBrowserNavigation
      : undefined;

    const execution = await toolExecutor.runTool({
      type: toolType,
      input: normalizedArgs,
      confirmationAccepted: shouldAutoConfirm,
    }, () => undefined);

    if (execution.status === 'requires_confirmation') {
      const confirmationRequest = {
        name: functionName,
        args: normalizedArgs,
        callId,
        target: typeof normalizedArgs.url === 'string' ? normalizedArgs.url : functionName,
        confirm: async () => {
          const confirmedExecution = await toolExecutor.runTool({
            type: toolType,
            input: normalizedArgs,
            confirmationAccepted: true,
          }, () => undefined);

          if (confirmedExecution.status === 'requires_confirmation') {
            this.callbacks?.onToolConfirmationRequest?.({
              ...confirmationRequest,
              confirm: () => undefined,
              cancel: () => undefined,
            });
            return;
          }

          geminiLiveClient.sendToolResponse(
            functionName,
            confirmedExecution.output ?? { status: confirmedExecution.status, result: confirmedExecution.output ?? null },
            callId,
          );
        },
        cancel: () => {
          geminiLiveClient.sendToolResponse(functionName, {
            status: 'cancelled',
            cancelled: true,
            message: 'User cancelled the requested website navigation.',
          }, callId);
        },
      };

      if (this.callbacks?.onToolConfirmationRequest) {
        this.callbacks.onToolConfirmationRequest(confirmationRequest);
        return;
      }

      geminiLiveClient.sendToolResponse(functionName, {
        status: execution.status,
        requiresConfirmation: true,
        message: execution.confirmationMessage ?? 'User confirmation is required before opening this website.',
      }, callId);
      return;
    }

    geminiLiveClient.sendToolResponse(functionName, execution.output ?? { status: execution.status, result: execution.output ?? null }, callId);
  }
}

export const speechService = new SpeechService();
