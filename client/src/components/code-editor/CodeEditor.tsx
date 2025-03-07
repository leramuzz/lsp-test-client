import { useState, useEffect, useRef } from 'react';
import {
  CodeActionRequest,
  CompletionRequest,
  DefinitionRequest,
  DidChangeTextDocumentNotification,
  DidChangeTextDocumentParams,
  DidCloseTextDocumentNotification,
  DidOpenTextDocumentNotification,
  DidOpenTextDocumentParams,
  DidSaveTextDocumentNotification,
  DidSaveTextDocumentParams,
  DocumentHighlightParams,
  DocumentHighlightRequest,
  DocumentSymbolRequest,
  HoverRequest,
  InitializeRequest,
  ReferencesRequest,
  SemanticTokensRequest,
  Position,
  ReferenceParams,
  DefinitionParams,
  HoverParams,
  CompletionParams,
  CodeActionParams,
  Range,
  Diagnostic,
  PublishDiagnosticsNotification,
  ShutdownRequest,
  DocumentSymbolParams,
  SemanticTokensParams,
  InitializeParams,
  TokenFormat,
  CodeActionKind,
  DiagnosticTag,
} from 'vscode-languageserver-protocol';
import './CodeEditor.css';

interface CodeEditorParams {
  uri: string;
  languageId: string;
  wsServerURL: string;
}

export default function CodeEditor({
  uri,
  languageId,
  wsServerURL,
}: CodeEditorParams) {
  const [text, setText] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [version, setVersion] = useState<number>(1);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(wsServerURL);

    ws.current.onopen = () => console.log('WebSocket connection established');
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('message', data);

      if (data.method?.method === PublishDiagnosticsNotification.method) {
        setDiagnostics(data.params);
      } else {
        setResponse(JSON.stringify(data, null, 2));
      }
    };
    ws.current.onerror = (error) => console.error('WebSocket Error:', error);
    ws.current.onclose = () => console.log('WebSocket connection closed');

    return () => ws?.current?.close();
  }, [languageId]);

  const sendRequest = (method: string) => {
    const params = getMethodParams(method);

    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ method, params }));
      setResponse('Waiting for response...');
    }
  };

  const getPosition = (): Position => {
    const textArea = document.getElementById('codeArea') as HTMLTextAreaElement;

    if (!textArea) {
      throw new Error('codeArea element not found');
    }

    const cursorPosition: number = textArea.selectionStart;

    const lines = text.substring(0, cursorPosition).split('\n');
    return {
      line: lines.length - 1,
      character: lines[lines.length - 1].length,
    };
  };

  const getTextRange = (): Range => {
    const lines = text.split('\n');
    return {
      start: { line: 0, character: 0 },
      end: {
        line: lines.length - 1,
        character: lines[lines.length - 1].length,
      },
    };
  };

  const getMethodParams = (method: string) => {
    const getCommonParams = () => ({ textDocument: { uri } });
    const getPositionalParams = () => ({
      ...getCommonParams(),
      position: getPosition(),
    });

    if (method === DidChangeTextDocumentNotification.method) {
      setVersion(version + 1);
    }

    const methodParamsMap: Record<string, any> = {
      [InitializeRequest.method]: {
        rootUri: null,
        capabilities: {
          textDocument: {
            publishDiagnostics: {
              relatedInformation: true,
              tagSupport: {
                valueSet: [DiagnosticTag.Deprecated, DiagnosticTag.Unnecessary],
              },
              versionSupport: true,
              codeDescriptionSupport: true,
              dataSupport: true,
            },
            documentSymbol: {
              hierarchicalDocumentSymbolSupport: true,
            },
            codeAction: {
              codeActionLiteralSupport: {
                codeActionKind: {
                  valueSet: [CodeActionKind.QuickFix],
                },
              },
            },
            semanticTokens: {
              requests: {},
              tokenTypes: [
                'namespace',
                'class',
                'interface',
                'enum',
                'enumMember',
                'type',
                'typeParameter',
                'method',
                'property',
                'variable',
                'parameter',
                'modifier',
                'keyword',
                'annotation',
                'annotationMember',
                'record',
                'recordComponent',
              ],
              tokenModifiers: [
                'abstract',
                'static',
                'readonly',
                'deprecated',
                'declaration',
                'documentation',
                'public',
                'private',
                'protected',
                'native',
                'generic',
                'typeArgument',
                'importDeclaration',
                'constructor',
              ],
              formats: [TokenFormat.Relative],
            },
          },
        },
      } as InitializeParams,
      [DidOpenTextDocumentNotification.method]: {
        textDocument: { uri, languageId, version, text },
      } as DidOpenTextDocumentParams,
      [DidChangeTextDocumentNotification.method]: {
        textDocument: { uri, version },
        contentChanges: [{ text }],
      } as DidChangeTextDocumentParams,
      [DidSaveTextDocumentNotification.method]:
        getCommonParams() as DidSaveTextDocumentParams,
      [DocumentHighlightRequest.method]:
        getPositionalParams() as DocumentHighlightParams,
      [ReferencesRequest.method]: {
        ...getPositionalParams(),
        context: { includeDeclaration: true },
      } as ReferenceParams,
      [DefinitionRequest.method]: getPositionalParams() as DefinitionParams,
      [HoverRequest.method]: getPositionalParams() as HoverParams,
      [CompletionRequest.method]: getPositionalParams() as CompletionParams,
      [CodeActionRequest.method]: {
        ...getCommonParams(),
        range: getTextRange(),
        context: { diagnostics },
      } as CodeActionParams,
      [DocumentSymbolRequest.method]: getCommonParams() as DocumentSymbolParams,
      [SemanticTokensRequest.method]: getCommonParams() as SemanticTokensParams,
      ['custom/parse']: getCommonParams(),
    };

    return methodParamsMap[method] ?? {};
  };

  const serverLifecycleActions: {
    label: string;
    method: string;
  }[] = [
    { label: 'Init Language Server', method: InitializeRequest.method },
    { label: 'Shutdown Server', method: ShutdownRequest.method },
  ];

  const documentLifecycleActions: {
    label: string;
    method: string;
  }[] = [
    {
      label: 'Send Open',
      method: DidOpenTextDocumentNotification.method,
    },
    {
      label: 'Send Change',
      method: DidChangeTextDocumentNotification.method,
    },
    {
      label: 'Send Save',
      method: DidSaveTextDocumentNotification.method,
    },
    { label: 'Send Close', method: DidCloseTextDocumentNotification.method },
  ];

  const languageFeaturesActions: {
    label: string;
    method: string;
  }[] = [
    {
      label: 'Highlights',
      method: DocumentHighlightRequest.method,
    },
    {
      label: 'References',
      method: ReferencesRequest.method,
    },
    { label: 'Semantic Tokens', method: SemanticTokensRequest.method },
    {
      label: 'Goto Definition',
      method: DefinitionRequest.method,
    },
    { label: 'Hover Info', method: HoverRequest.method },
    {
      label: 'Completions',
      method: CompletionRequest.method,
    },
    {
      label: 'Code Actions',
      method: CodeActionRequest.method,
    },
    { label: 'Symbols', method: DocumentSymbolRequest.method },
    { label: 'Parsed Data', method: 'custom/parse' },
  ];

  return (
    <div>
      <h1>{`${languageId?.toUpperCase()} Code Editor`}</h1>
      <p>{uri}</p>
      <textarea
        id="codeArea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Type your ${languageId} code here...`}
      />
      <div className="btn-group">
        <h4>Server Lifecycle</h4>
        {serverLifecycleActions.map(({ label, method }) => (
          <button
            key={method}
            onClick={() => sendRequest(method)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="btn-group">
        <h4>Document Lifecycle</h4>
        {documentLifecycleActions.map(({ label, method }) => (
          <button
            key={method}
            onClick={() => sendRequest(method)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="btn-group">
        <h4>Language Features</h4>
        {languageFeaturesActions.map(({ label, method }) => (
          <button
            key={method}
            onClick={() => sendRequest(method)}
          >
            {label}
          </button>
        ))}
      </div>
      <div id="feedbacksWrapper">
        <div>
          <h3>Response:</h3>
          <pre>{response}</pre>
        </div>
        <div>
          <h3>Diagnostics:</h3>
          <pre>{JSON.stringify(diagnostics, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
