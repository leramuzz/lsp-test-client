import { useState } from 'react';
import CodeEditor from './components/code-editor/CodeEditor';
import LanguageSelector from './components/language-selector/LanguageSelector';
import { CONFIG } from './config';
import { Language } from './lang.enum';

function App() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    Language.JAVA
  );

  return (
    <>
      <LanguageSelector
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
      />
      <CodeEditor
        uri={CONFIG[selectedLanguage].fileUri}
        languageId={CONFIG[selectedLanguage].languageId}
        wsServerURL={CONFIG[selectedLanguage].wsServerURL}
      />
    </>
  );
}

export default App;
