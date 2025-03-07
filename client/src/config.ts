import { Language } from './lang.enum';

type LanguageConfig = {
  languageId: string;
  fileUri: string;
  wsServerURL: string;
};

type Config = {
  [key in Language]: LanguageConfig;
};

export const CONFIG: Config = {
  [Language.JAVA]: {
    languageId: Language.JAVA,
    fileUri:
      'file:///path/to/projects/java-project/src/main/java/com/example/Main.java',
    wsServerURL: 'ws://localhost:3000/java',
  },
  [Language.PYTHON]: {
    languageId: Language.PYTHON,
    fileUri: 'file:///path/to/projects/python-project/example.py',
    wsServerURL: 'ws://localhost:3000/python',
  },
};
