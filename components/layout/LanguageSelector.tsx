'use client';

import { useTranslations } from '@/utils/i18n/TranslationsContext';
import { languages } from '@/utils/i18n/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LanguageSelector() {
  const { language, setLanguage, t } = useTranslations();

  const currentLanguage = languages.find(lang => lang.code === language);

  return (
    <Select 
      value={language} 
      onValueChange={(newValue) => {
        console.log('Changing language to:', newValue); // Debug log
        setLanguage(newValue as Language);
      }}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue>
          {currentLanguage ? `${currentLanguage.nativeName} (${currentLanguage.name})` : t('language.select')}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.nativeName} ({lang.name})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 