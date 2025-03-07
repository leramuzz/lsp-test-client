import * as rpc from 'vscode-jsonrpc';
import {
  InitializeParams,
  InitializeRequest,
  InitializeResult,
  InitializedNotification,
  ShutdownRequest,
  ExitNotification,
  DidOpenTextDocumentNotification,
  DidOpenTextDocumentParams,
  DidChangeTextDocumentNotification,
  DidChangeTextDocumentParams,
  DidSaveTextDocumentParams,
  DidSaveTextDocumentNotification,
  DidCloseTextDocumentParams,
  DidCloseTextDocumentNotification,
  DocumentHighlightParams,
  DocumentHighlightRequest,
  DocumentHighlight,
  ReferenceParams,
  Location,
  ReferencesRequest,
  DefinitionParams,
  DefinitionRequest,
  LocationLink,
  HoverParams,
  HoverRequest,
  CompletionParams,
  Hover,
  CompletionRequest,
  CompletionList,
  CompletionItem,
  CodeActionParams,
  CodeActionRequest,
  Command,
  CodeAction,
  SemanticTokensParams,
  SemanticTokensRequest,
  SemanticTokens,
  DocumentSymbolParams,
  DocumentSymbolRequest,
  DocumentSymbol,
  SymbolInformation,
  MarkedString,
} from 'vscode-languageserver-protocol';
import { WebSocket } from 'ws';
import {
  addModifiersToSymbols,
  addTokensWithinMethodsInfo,
  CustomDocumentSymbol,
  extractModifiersFromTokens,
} from './document.helper.js';

export abstract class LanguageServerService {
  ws: WebSocket;
  connection: rpc.MessageConnection | null;
  tokenTypes: string[] | undefined;
  tokenModifiers: string[] | undefined;

  constructor(ws: WebSocket) {
    this.ws = ws;
    this.connection = null;
    this.tokenTypes = [];
    this.tokenModifiers = [];
  }

  async handleRequest(method: string, params: any) {
    switch (method) {
      case InitializeRequest.method:
        return await this.initializeLanguageServer(params);
      case ShutdownRequest.method:
        return await this.shutdownLanguageServer();
      case DidOpenTextDocumentNotification.method:
        return await this.notifyDidOpenDocument(params);
      case DidChangeTextDocumentNotification.method:
        return await this.notifyDidChangeDocument(params);
      case DidSaveTextDocumentNotification.method:
        return await this.notifyDidSaveDocument(params);
      case DidCloseTextDocumentNotification.method:
        return await this.notifyDidCloseDocument(params);
      case DocumentHighlightRequest.method:
        return await this.getHighlights(params);
      case ReferencesRequest.method:
        return await this.getReferences(params);
      case DefinitionRequest.method:
        return await this.goToDefinition(params);
      case HoverRequest.method:
        return await this.getHover(params);
      case CompletionRequest.method:
        return await this.getCompletions(params);
      case CodeActionRequest.method:
        return await this.getCodeActions(params);
      case SemanticTokensRequest.method:
        return await this.getSemanticTokens(params);
      case DocumentSymbolRequest.method:
        return await this.getDocumentSymbols(params);
      case 'custom/parse':
        return await this.getParsedData(params);
      default:
        return { error: 'Unknown action' };
    }
  }

  abstract initializeLanguageServer(
    params: InitializeParams
  ): Promise<InitializeResult | undefined>;

  async sendInitializeRequest(
    initializeParams: InitializeParams
  ): Promise<InitializeResult | undefined> {
    initializeParams.processId = process.pid;
    return this.connection?.sendRequest(
      InitializeRequest.method,
      initializeParams
    );
  }

  async sendInitializedNotification(): Promise<void | undefined> {
    return this.connection?.sendNotification(InitializedNotification.method);
  }

  private async shutdownLanguageServer(): Promise<void> {
    await this.sendShutdownRequest();
    await this.sendExitNotification();
  }

  private async sendShutdownRequest(): Promise<void | undefined> {
    return this.connection?.sendRequest(ShutdownRequest.method);
  }

  private async sendExitNotification(): Promise<void | undefined> {
    return this.connection?.sendNotification(ExitNotification.method);
  }

  private async notifyDidOpenDocument(
    params: DidOpenTextDocumentParams
  ): Promise<void | undefined> {
    return this.connection?.sendNotification(
      DidOpenTextDocumentNotification.method,
      params
    );
  }

  private async notifyDidChangeDocument(
    params: DidChangeTextDocumentParams
  ): Promise<void | undefined> {
    return this.connection?.sendNotification(
      DidChangeTextDocumentNotification.method,
      params
    );
  }

  private async notifyDidSaveDocument(
    params: DidSaveTextDocumentParams
  ): Promise<void | undefined> {
    return this.connection?.sendNotification(
      DidSaveTextDocumentNotification.method,
      params
    );
  }

  private async notifyDidCloseDocument(
    params: DidCloseTextDocumentParams
  ): Promise<void | undefined> {
    return this.connection?.sendNotification(
      DidCloseTextDocumentNotification.method,
      params
    );
  }

  private async getHighlights(
    params: DocumentHighlightParams
  ): Promise<DocumentHighlight[] | null | undefined> {
    return this.connection?.sendRequest(
      DocumentHighlightRequest.method,
      params
    );
  }

  private async getReferences(
    params: ReferenceParams
  ): Promise<Location[] | null | undefined> {
    return this.connection?.sendRequest(ReferencesRequest.method, params);
  }

  private async goToDefinition(
    params: DefinitionParams
  ): Promise<
    { result: Location | Location[] | LocationLink[] | null } | undefined
  > {
    return this.connection?.sendRequest(DefinitionRequest.method, params);
  }

  private async getHover(
    params: HoverParams
  ): Promise<Hover | null | undefined> {
    return this.connection?.sendRequest(HoverRequest.method, params);
  }

  private async getCompletions(
    params: CompletionParams
  ): Promise<CompletionItem[] | CompletionList | null | undefined> {
    return this.connection?.sendRequest(CompletionRequest.method, params);
  }

  private async getCodeActions(
    params: CodeActionParams
  ): Promise<(Command | CodeAction)[] | null | undefined> {
    return this.connection?.sendRequest(CodeActionRequest.method, params);
  }

  private async getSemanticTokens(
    params: SemanticTokensParams
  ): Promise<SemanticTokens | null | undefined> {
    return this.connection?.sendRequest(SemanticTokensRequest.method, params);
  }

  private async getDocumentSymbols(
    params: DocumentSymbolParams
  ): Promise<DocumentSymbol[] | SymbolInformation[] | null | undefined> {
    return this.connection?.sendRequest(DocumentSymbolRequest.method, params);
  }

  private async getParsedData(
    params: DocumentSymbolParams
  ): Promise<CustomDocumentSymbol[] | undefined> {
    const semanticTokens = await this.getSemanticTokens(params);
    const documentSymbols = await this.getDocumentSymbols(params);

    if (
      semanticTokens &&
      documentSymbols &&
      this.tokenTypes &&
      this.tokenModifiers
    ) {
      const extractedTokens = extractModifiersFromTokens(
        semanticTokens,
        this.tokenTypes,
        this.tokenModifiers
      );

      addModifiersToSymbols(
        documentSymbols as CustomDocumentSymbol[],
        extractedTokens
      );

      addTokensWithinMethodsInfo(
        documentSymbols as CustomDocumentSymbol[],
        extractedTokens
      );

      const addCommentsToSymbols = async (
        documentSymbols: CustomDocumentSymbol[]
      ) => {
        for (let i = 0; i < documentSymbols.length; i++) {
          const hoverParams: HoverParams = {
            ...params,
            position: {
              line: documentSymbols[i].selectionRange.start.line,
              character: documentSymbols[i].selectionRange.start.character,
            },
          };

          const hoverInfo = await this.getHover(hoverParams);

          documentSymbols[i].comment = (
            hoverInfo?.contents as MarkedString[] as string[]
          )?.[1];

          if (
            documentSymbols[i].children &&
            (documentSymbols[i].children as CustomDocumentSymbol[]).length
          ) {
            await addCommentsToSymbols(
              documentSymbols[i].children as CustomDocumentSymbol[]
            );
          }
        }
      };

      await addCommentsToSymbols(documentSymbols as CustomDocumentSymbol[]);

      return documentSymbols as CustomDocumentSymbol[];
    }
  }
}
