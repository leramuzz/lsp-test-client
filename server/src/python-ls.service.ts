import * as rpc from 'vscode-jsonrpc';
import { spawn } from 'cross-spawn';
import {
  InitializeParams,
  InitializeResult,
  PublishDiagnosticsNotification,
} from 'vscode-languageserver-protocol';
import { LanguageServerService } from './ls.service.js';

export class PythonLanguageServerService extends LanguageServerService {
  async initializeLanguageServer(params: InitializeParams) {
    const serverProcess = spawn('pyright-langserver', ['--stdio']);

    this.connection = rpc.createMessageConnection(
      new (rpc as any).StreamMessageReader(serverProcess.stdout),
      new (rpc as any).StreamMessageWriter(serverProcess.stdin)
    );

    this.connection.listen();

    const initializeResult: InitializeResult<any> | undefined =
      await this.sendInitializeRequest(params);

    this.tokenTypes =
      initializeResult?.capabilities.semanticTokensProvider?.legend.tokenTypes;
    this.tokenModifiers =
      initializeResult?.capabilities.semanticTokensProvider?.legend.tokenModifiers;

    await this.sendInitializedNotification();

    this.connection.onNotification(
      PublishDiagnosticsNotification.method,
      (params) => {
        this.ws.send(
          JSON.stringify({
            method: PublishDiagnosticsNotification.type,
            params,
          })
        );
      }
    );

    return initializeResult;
  }
}
