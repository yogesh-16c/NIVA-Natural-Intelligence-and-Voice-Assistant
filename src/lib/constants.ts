import { LanguageOption, VoiceOption } from '../types/assistant';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    samplePrompt: 'Plan a calm afternoon and summarize my priorities',
    greetingMorning: 'Good morning',
    greetingAfternoon: 'Good afternoon',
    greetingEvening: 'Good evening',
    subGreeting: 'What can I help you accomplish?'
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    samplePrompt: 'आज की प्राथमिकताएँ संक्षेप में बताओ',
    greetingMorning: 'सुप्रभात',
    greetingAfternoon: 'शुभ दोपहर',
    greetingEvening: 'शुभ संध्या',
    subGreeting: 'आज मैं आपकी क्या सहायता करूँ?'
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    samplePrompt: 'आजची प्राथमिकतां संक्षेपात सांग',
    greetingMorning: 'शुभ सकाळ',
    greetingAfternoon: 'शुभ दुपार',
    greetingEvening: 'शुभ संध्याकाळ',
    subGreeting: 'मी तुम्हाला कशी मदत करू शकेन?'
  }
];

export const AVAILABLE_VOICES: VoiceOption[] = [
  {
    id: 'niva-calm-female',
    name: 'Niva Calm',
    lang: 'en-US',
    gender: 'female',
    recommendedFor: ['en', 'hi', 'mr']
  },
  {
    id: 'niva-clarity-male',
    name: 'Niva Clarity',
    lang: 'en-US',
    gender: 'male',
    recommendedFor: ['en']
  },
  {
    id: 'niva-indica-female',
    name: 'Niva Voice',
    lang: 'hi-IN',
    gender: 'female',
    recommendedFor: ['hi', 'mr', 'en']
  }
];

export const SUGGESTED_ACTIONS = [
  {
    id: 'quick-plan',
    label: 'Plan my next steps',
    query: 'Help me plan my next steps and keep the priorities clear',
    category: 'General'
  },
  {
    id: 'summarize',
    label: 'Summarize this context',
    query: 'Summarize what matters most from this context',
    category: 'General'
  },
  {
    id: 'open-github',
    label: 'Open GitHub',
    query: 'Open https://github.com',
    category: 'Browser'
  },
  {
    id: 'calc-math',
    label: 'What is 25 × 4?',
    query: 'What is 25 * 4?',
    category: 'Tool'
  }
];
