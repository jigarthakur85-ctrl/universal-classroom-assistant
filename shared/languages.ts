export const INDIAN_LANGUAGES = {
  gujarati: { name: 'Gujarati', code: 'gu', nativeName: 'ગુજરાતી' },
  marathi: { name: 'Marathi', code: 'mr', nativeName: 'मराठी' },
  punjabi: { name: 'Punjabi', code: 'pa', nativeName: 'ਪੰਜਾਬੀ' },
  bengali: { name: 'Bengali', code: 'bn', nativeName: 'বাংলা' },
  tamil: { name: 'Tamil', code: 'ta', nativeName: 'தமிழ்' },
  telugu: { name: 'Telugu', code: 'te', nativeName: 'తెలుగు' },
  kannada: { name: 'Kannada', code: 'kn', nativeName: 'ಕನ್ನಡ' },
  malayalam: { name: 'Malayalam', code: 'ml', nativeName: 'മലയാളം' },
} as const;

export type IndianLanguage = keyof typeof INDIAN_LANGUAGES;

export const INDIAN_LANGUAGE_OPTIONS = Object.entries(INDIAN_LANGUAGES).map(([key, value]) => ({
  value: key as IndianLanguage,
  label: `${value.name} (${value.nativeName})`,
  code: value.code,
}));
