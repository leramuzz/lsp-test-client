import { CONFIG } from '../../config';
import { Language } from '../../lang.enum';

interface LanguageSelectorProps {
  selectedLanguage: Language;
  setSelectedLanguage: (language: Language) => void;
}

export default function LanguageSelector({
  selectedLanguage,
  setSelectedLanguage,
}: LanguageSelectorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLanguage(e.target.value as Language);
  };

  return (
    <div>
      <span>Select a Language: </span>
      <select
        value={selectedLanguage}
        onChange={(e) => handleChange(e)}
      >
        <option
          value=""
          disabled
        >
          Choose a language
        </option>
        {Object.keys(CONFIG).map((lang) => (
          <option
            key={lang}
            value={lang}
          >
            {lang}
          </option>
        ))}
      </select>
    </div>
  );
}
