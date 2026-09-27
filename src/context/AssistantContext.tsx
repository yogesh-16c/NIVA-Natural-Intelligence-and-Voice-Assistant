import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  AssistantState,
  ChatMessage,
  SupportedLanguage,
  ToolExecution,
  User,
  ActivityItem
} from '../types/assistant';
import { authService } from '../services/auth/authService';
import { speechService } from '../services/voice/speechService';
import { toolExecutor } from '../services/tools/toolExecutor';
import { activityStore } from '../services/activity/activityStore';
import { apiClient } from '../services/api/apiClient';
import { SUPPORTED_LANGUAGES, AVAILABLE_VOICES } from '../lib/constants';

interface ConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface AssistantContextType {
  user: User | null;
  assistantState: AssistantState;
  audioLevel: number;
  currentTranscript: string;
  isTranscribing: boolean;
  currentLanguage: SupportedLanguage;
  selectedVoice: string;
  autoSpeak: boolean;
  bargeIn: boolean;
  currentToolExecution: ToolExecution | null;
  messages: ChatMessage[];
  activities: ActivityItem[];
  confirmationModal: ConfirmationState | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  interrupt: () => void;
  processUserInput: (text: string) => Promise<void>;
  setLanguage: (lang: SupportedLanguage) => void;
  setSelectedVoice: (voiceId: string) => void;
  setAutoSpeak: (val: boolean) => void;
  setBargeIn: (val: boolean) => void;
  clearChat: () => void;
  refreshActivities: () => void;
  updateUser: (name: string) => void;
  logout: () => void;
}

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_init_1',
    role: 'assistant',
    text: 'Good day. I am NIVA. I can help with conversation, quick checking, and focused actions.',
    timestamp: Date.now() - 1000 * 60 * 10,
    language: 'en'
  }
];

export const AssistantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authService.getUser());

  useEffect(() => {
    void authService.restoreSession().then((sessionUser) => {
      if (sessionUser) {
        setUser(sessionUser);
      } else {
        setUser(authService.getUser());
      }
    });
  }, []);
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [currentLanguage, setCurrentLanguageState] = useState<SupportedLanguage>('en');
  const [selectedVoice, setSelectedVoice] = useState<string>(AVAILABLE_VOICES[0].id);
  const [autoSpeak, setAutoSpeakState] = useState<boolean>(true);
  const [bargeIn, setBargeInState] = useState<boolean>(true);
  const [currentToolExecution, setCurrentToolExecution] = useState<ToolExecution | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem('niva_chat_history');
      return stored ? JSON.parse(stored) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });
  const [activities, setActivities] = useState<ActivityItem[]>(() => activityStore.getActivities());
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationState | null>(null);
  const lastLiveUserText = useRef<string>('');
  const lastLiveAssistantText = useRef<string>('');

  // Sync auth updates
  useEffect(() => {
    const handleAuthChange = (e: CustomEvent<User | null>) => {
      setUser(e.detail);
    };
    window.addEventListener('niva-auth-changed' as any, handleAuthChange as any);
    return () => window.removeEventListener('niva-auth-changed' as any, handleAuthChange as any);
  }, []);

  // Sync activity updates
  useEffect(() => {
    const handleActivityChange = () => {
      setActivities(activityStore.getActivities());
    };
    window.addEventListener('niva-activity-added', handleActivityChange);
    return () => window.removeEventListener('niva-activity-added', handleActivityChange);
  }, []);

  // Persist chat
  useEffect(() => {
    try {
      localStorage.setItem('niva_chat_history', JSON.stringify(messages));
    } catch {
      // no-op
    }
  }, [messages]);

  const processUserInput = useCallback(
    async (text: string) => {
      const cleanInput = text.trim();
      if (!cleanInput) return;

      // 1. Add User Message
      const userMsg: ChatMessage = {
        id: `usr_${Date.now()}`,
        role: 'user',
        text: cleanInput,
        timestamp: Date.now(),
        language: currentLanguage
      };

      setMessages((prev) => [...prev, userMsg]);
      activityStore.addActivity({
        type: 'conversation',
        title: `Prompt: ${cleanInput.slice(0, 32)}${cleanInput.length > 32 ? '…' : ''}`,
        description: `Voice/text instruction processed in ${currentLanguage.toUpperCase()}.`,
        status: 'success',
        details: { input: cleanInput, language: currentLanguage }
      });

      // 2. Set State: Thinking
      setAssistantState('thinking');

      // 3. Tool Check
      const detectedTool = toolExecutor.detectToolFromQuery(cleanInput);

      if (detectedTool) {
        if (detectedTool.type === 'browser_open') {
          // Requires confirmation safety flow
          const targetUrl = detectedTool.input.url;
          setConfirmationModal({
            isOpen: true,
            title: 'Authorization Required for Web Action',
            message: `NIVA is asking to open external destination: ${targetUrl}. Do you want to proceed?`,
            onConfirm: async () => {
              setConfirmationModal(null);
              const toolResult = await toolExecutor.runTool({
                ...detectedTool,
                confirmationAccepted: true
              });
              setCurrentToolExecution(toolResult);

              const respText = currentLanguage === 'hi'
                ? `मैंने सुरक्षित रूप से ${targetUrl} खोल दिया है।`
                : currentLanguage === 'mr'
                ? `मी सुरक्षितपणे ${targetUrl} उघडले आहे.`
                : `Opened destination: ${targetUrl}.`;

              const assistMsg: ChatMessage = {
                id: `asst_${Date.now()}`,
                role: 'assistant',
                text: respText,
                timestamp: Date.now(),
                language: currentLanguage,
                toolExecution: toolResult
              };
              setMessages((prev) => [...prev, assistMsg]);
              setAssistantState('speaking');
              await speechService.speak(respText, selectedVoice);
              setCurrentToolExecution(null);
            },
            onCancel: () => {
              setConfirmationModal(null);
              setAssistantState('idle');
              const cancelText = currentLanguage === 'hi'
                ? 'वेबसाइट खोलने की अनुमति रद्द कर दी गई।'
                : currentLanguage === 'mr'
                ? 'वेबसाइट उघडण्याची परवानगी रद्द करण्यात आली.'
                : 'Navigation cancelled by user request.';
              const assistMsg: ChatMessage = {
                id: `asst_${Date.now()}`,
                role: 'assistant',
                text: cancelText,
                timestamp: Date.now(),
                language: currentLanguage
              };
              setMessages((prev) => [...prev, assistMsg]);
            }
          });
          return;
        }

        // Run tool directly
        const toolResult = await toolExecutor.runTool(detectedTool, (exec) => {
          setCurrentToolExecution(exec);
        });

        // Formulate spoken response based on tool result
        let spokenText = '';
        if (toolResult.type === 'calculator') {
          const res = toolResult.output?.result;
          if (currentLanguage === 'hi') {
            spokenText = `गणना परिणाम: ${res} है।`;
          } else if (currentLanguage === 'mr') {
            spokenText = `गणनेचे उत्तर: ${res} आहे.`;
          } else {
            spokenText = `The calculation result is ${res}.`;
          }
        } else if (toolResult.type === 'research_sources' || toolResult.type === 'web_search') {
          const sourcesCount = toolResult.output?.sourcesCount || 0;
          const summary = toolResult.output?.summary || '';
          if (currentLanguage === 'hi') {
            spokenText = `मैंने ${sourcesCount} स्रोतों का सारांश तैयार किया है: ${summary}`;
          } else if (currentLanguage === 'mr') {
            spokenText = `मी ${sourcesCount} स्रोतांचे सारांश तयार केले आहे: ${summary}`;
          } else {
            spokenText = `I gathered ${sourcesCount} relevant sources and summarized the key points: ${summary}`;
          }
        } else if (toolResult.type === 'screen_analysis') {
          const summary = toolResult.output?.summary || '';
          spokenText = currentLanguage === 'hi'
            ? `स्क्रीन और संदर्भ का विश्लेषण पूर्ण हुआ। ${summary}`
            : currentLanguage === 'mr'
            ? `स्क्रीन आणि संदर्भाचे विश्लेषण पूर्ण झाले. ${summary}`
            : `Screen analysis complete. ${summary}`;
        }

        const assistMsg: ChatMessage = {
          id: `asst_${Date.now()}`,
          role: 'assistant',
          text: spokenText,
          timestamp: Date.now(),
          language: currentLanguage,
          toolExecution: toolResult,
          sources: toolResult.output?.sources
        };

        setMessages((prev) => [...prev, assistMsg]);
        setAssistantState('speaking');
        await speechService.speak(spokenText, selectedVoice);
        setTimeout(() => {
          setCurrentToolExecution(null);
        }, 1200);
      } else {
        try {
          const backendResponse = await apiClient.chat({
            message: cleanInput,
            conversationId: undefined,
            language: currentLanguage,
          });

          const assistMsg: ChatMessage = {
            id: `asst_${Date.now()}`,
            role: 'assistant',
            text: backendResponse.response,
            timestamp: Date.now(),
            language: currentLanguage,
            sources: backendResponse.metadata?.sources || []
          };

          setMessages((prev) => [...prev, assistMsg]);
          setAssistantState('speaking');
          await speechService.speak(backendResponse.response, selectedVoice);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'The backend is unavailable.';
          const assistMsg: ChatMessage = {
            id: `asst_${Date.now()}`,
            role: 'assistant',
            text: `I am unable to reach the backend right now. ${message}`,
            timestamp: Date.now(),
            language: currentLanguage
          };

          setMessages((prev) => [...prev, assistMsg]);
          setAssistantState('error');
          await speechService.speak(assistMsg.text, selectedVoice);
          setTimeout(() => setAssistantState('idle'), 1200);
        }
      }
    },
    [currentLanguage, selectedVoice]
  );

  // Set up speech service callbacks
  useEffect(() => {
    speechService.setCallbacks({
      onStateChange: (st: string) => {
        setAssistantState(st as any);
        if (st === 'listening') {
          setIsTranscribing(true);
        } else if (st === 'idle' || st === 'speaking') {
          setIsTranscribing(false);
        }
      },
      onUserTranscript: (text: string, isFinal: boolean) => {
        setCurrentTranscript(text);
        if (isFinal) {
          const trimmed = text.trim();
          if (trimmed && trimmed !== lastLiveUserText.current) {
            lastLiveUserText.current = trimmed;
            setMessages((prev) => [...prev, {
              id: `live_usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              role: 'user',
              text: trimmed,
              timestamp: Date.now(),
              language: currentLanguage,
            }]);
          }
          setIsTranscribing(false);
        }
      },
      onInterimUserTranscript: (text: string) => {
        setCurrentTranscript(text);
        setIsTranscribing(true);
      },
      onAssistantTranscript: (text: string, isFinal: boolean) => {
        if (text.trim().length > 0) {
          setCurrentTranscript(text);
        }
        if (isFinal) {
          const trimmed = text.trim();
          if (trimmed && trimmed !== lastLiveAssistantText.current) {
            lastLiveAssistantText.current = trimmed;
            setMessages((prev) => [...prev, {
              id: `live_asst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              role: 'assistant',
              text: trimmed,
              timestamp: Date.now(),
              language: currentLanguage,
            }]);
          }
          setIsTranscribing(false);
        }
      },
      onToolConfirmationRequest: ({ args, target, confirm, cancel }: {
        name: string;
        args: Record<string, unknown>;
        callId?: string;
        target: string;
        confirm: () => Promise<void> | void;
        cancel: () => void;
      }) => {
        const targetLabel = typeof args.url === 'string' ? args.url : target;
        setConfirmationModal({
          isOpen: true,
          title: 'Authorization Required for Web Action',
          message: `NIVA wants to open ${targetLabel}. Do you want to proceed?`,
          onConfirm: async () => {
            setConfirmationModal(null);
            await confirm();
          },
          onCancel: () => {
            setConfirmationModal(null);
            cancel();
          },
        });
      },
      onError: (msg: string) => {
        console.warn('Speech error:', msg);
        setAssistantState('idle');
        setIsTranscribing(false);
      },
      onAudioLevel: (lvl: number) => {
        setAudioLevel(lvl);
      }
    } as any);

    speechService.setLanguage(currentLanguage);
    speechService.setPreferences(autoSpeak, bargeIn);
  }, [currentLanguage, autoSpeak, bargeIn, processUserInput]);

  const setLanguage = (lang: SupportedLanguage) => {
    setCurrentLanguageState(lang);
    speechService.setLanguage(lang);
  };

  const setAutoSpeak = (val: boolean) => {
    setAutoSpeakState(val);
    speechService.setPreferences(val, bargeIn);
  };

  const setBargeIn = (val: boolean) => {
    setBargeInState(val);
    speechService.setPreferences(autoSpeak, val);
  };

  const startListening = async () => {
    setCurrentTranscript('');
    lastLiveUserText.current = '';
    lastLiveAssistantText.current = '';
    const started = await speechService.startListening();
    if (!started) {
      setAssistantState('idle');
      setIsTranscribing(false);
    }
  };

  const stopListening = () => {
    speechService.stopListening();
    setCurrentTranscript('');
    setIsTranscribing(false);
    setAssistantState('idle');
  };

  const interrupt = () => {
    speechService.interrupt();
    setCurrentTranscript('');
    setAssistantState('interrupted');
    setTimeout(() => setAssistantState('idle'), 600);
  };

  const refreshActivities = () => {
    setActivities(activityStore.getActivities());
  };

  const updateUser = (name: string) => {
    const updated = authService.updateProfile(name);
    if (updated) setUser(updated);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const clearChat = () => {
    const fresh = [INITIAL_MESSAGES[0]];
    setMessages(fresh);
    localStorage.setItem('niva_chat_history', JSON.stringify(fresh));
  };


  return (
    <AssistantContext.Provider
      value={{
        user,
        assistantState,
        audioLevel,
        currentTranscript,
        isTranscribing,
        currentLanguage,
        selectedVoice,
        autoSpeak,
        bargeIn,
        currentToolExecution,
        messages,
        activities,
        confirmationModal,
        startListening,
        stopListening,
        interrupt,
        processUserInput,
        setLanguage,
        setSelectedVoice,
        setAutoSpeak,
        setBargeIn,
        clearChat,
        refreshActivities,
        updateUser,
        logout
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
};

export const useAssistant = () => {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return context;
};
