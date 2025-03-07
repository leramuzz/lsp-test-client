import {
  DocumentSymbol,
  Position,
  SemanticTokens,
  SymbolKind,
} from 'vscode-languageserver-protocol';

export type ParseTokensResult = {
  position: Position;
  type: string;
  modifiers: string[];
  length: number;
}[];

export const extractModifiersFromTokens = (
  semanticTokens: SemanticTokens | null,
  tokenTypes: string[],
  tokenModifiers: string[]
): ParseTokensResult => {
  if (!semanticTokens) return [];

  let deltaLine = 0;
  let deltaCharacter = 0;
  let result = [];

  for (let i = 0; i < semanticTokens.data.length; i += 5) {
    const tokenModifiersValue = semanticTokens.data[i + 4];
    let tokenModifiersList = [];

    // Loop through the possible tokenModifiers and check if the bit is set
    for (let j = 0; j < tokenModifiers.length; j++) {
      const modifierFlag = 1 << j;
      if ((tokenModifiersValue & modifierFlag) !== 0) {
        // If the bit is set, add the corresponding modifier to the list
        tokenModifiersList.push(tokenModifiers[j]);
      }
    }

    const tokenLineRelative = semanticTokens.data[i];
    const tokenLine = tokenLineRelative + deltaLine;
    deltaLine += tokenLineRelative;

    if (i !== 0 && tokenLineRelative !== 0) {
      deltaCharacter = 0;
    }

    const tokenCharacterRelative = semanticTokens.data[i + 1];
    const tokenCharacter = tokenCharacterRelative + deltaCharacter;

    deltaCharacter += tokenCharacterRelative;

    const tokenLength = semanticTokens.data[i + 2];
    const tokenType = tokenTypes[semanticTokens.data[i + 3]];

    result.push({
      position: { line: tokenLine, character: tokenCharacter },
      type: tokenType,
      modifiers: tokenModifiersList,
      length: tokenLength,
      // lineRel: tokenLineRelative,
      // charRel: tokenCharacterRelative,
      // deltaChar: deltaCharacter,
    });
  }

  return result;
};

export type CustomDocumentSymbol = DocumentSymbol & {
  type?: string;
  modifiers?: string[];
  tokensWithinMethod?: ParseTokensResult;
  comment?: string;
};

export const addModifiersToSymbols = (
  symbols: CustomDocumentSymbol[],
  tokens: ParseTokensResult
): void => {
  if (!symbols) return symbols;

  symbols.forEach((symbol) => {
    const token = tokens.find(
      (token) =>
        symbol.selectionRange.start.line === token.position.line &&
        symbol.selectionRange.start.character === token.position.character
    );

    if (token) {
      const { type, modifiers } = token;
      symbol.type = type;
      symbol.modifiers = modifiers;
    }

    if (symbol.children && symbol.children.length > 0) {
      addModifiersToSymbols(symbol.children, tokens);
    }
  });
};

export const addTokensWithinMethodsInfo = (
  symbols: CustomDocumentSymbol[],
  tokens: ParseTokensResult
) => {
  symbols?.forEach((symbol) => {
    if (
      symbol.kind === SymbolKind.Method ||
      symbol.kind === SymbolKind.Function
    ) {
      const tokensWithinMethod = tokens.filter(
        (token) =>
          (token.position.line > symbol.selectionRange.start.line ||
            (token.position.line === symbol.selectionRange.start.line &&
              token.position.character >
                symbol.selectionRange.start.character)) &&
          (token.position.line < symbol.range.end.line ||
            (token.position.line === symbol.range.end.line &&
              token.position.character < symbol.range.end.character))
      );

      if (tokensWithinMethod) {
        symbol.tokensWithinMethod = tokensWithinMethod;
      }
    }

    if (symbol.children && symbol.children.length > 0) {
      addTokensWithinMethodsInfo(symbol.children, tokens);
    }
  });
};
