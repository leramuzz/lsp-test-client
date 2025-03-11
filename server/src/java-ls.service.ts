import os from 'os';
import * as rpc from 'vscode-jsonrpc';
import { fileURLToPath } from 'url';
import path from 'path';
import { spawn } from 'cross-spawn';
import {
  InitializeParams,
  InitializeResult,
  PublishDiagnosticsNotification,
} from 'vscode-languageserver-protocol';
import { LanguageServerService } from './ls.service.js';

export class JavaLanguageServerService extends LanguageServerService {
  async initializeLanguageServer(params: InitializeParams) {
    const defineConfigDir = () => {
      let configDir;
      const platform = os.platform();

      if (platform === 'win32') {
        configDir = 'config_win';
      } else if (platform === 'darwin') {
        configDir = 'config_mac';
      } else {
        configDir = 'config_linux';
      }

      return configDir;
    };

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const serverPath = path.resolve(__dirname, '../java-ls');

    const launcherJar = path.join(
      serverPath,
      'plugins',
      'org.eclipse.equinox.launcher_1.6.1100.v20250306-0509.jar'
    );

    const serverProcess = spawn('java', [
      '-Declipse.application=org.eclipse.jdt.ls.core.id1',
      '-Dosgi.bundles.defaultStartLevel=4',
      '-Declipse.product=org.eclipse.jdt.ls.core.product',
      '-Dlog.level=ALL',
      '-Xmx1G',
      '--add-modules=ALL-SYSTEM',
      '--add-opens',
      'java.base/java.util=ALL-UNNAMED',
      '--add-opens',
      'java.base/java.lang=ALL-UNNAMED',
      '-jar',
      launcherJar,
      '-configuration',
      path.join(serverPath, defineConfigDir()),
      '-data',
      path.join(serverPath, 'data'), // specify your data directory
    ]);

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
