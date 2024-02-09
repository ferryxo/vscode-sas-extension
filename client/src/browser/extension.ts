// Copyright © 2022, SAS Institute Inc., Cary, NC, USA.  All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ExtensionContext, Uri, commands } from "vscode";
import { LanguageClientOptions } from "vscode-languageclient";
import { LanguageClient } from "vscode-languageclient/browser";
import * as fs from "fs";
import * as path from 'path';

let client: LanguageClient;

// this method is called when vs code is activated
export function activate(context: ExtensionContext): void {
  commands.executeCommand("setContext", "SAS.hideRunMenuItem", true);

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for sas file
    documentSelector: [{ language: "sas" }],
  };

  client = createWorkerLanguageClient(context, clientOptions);

  client.start();
}

function createWorkerLanguageClient(
  context: ExtensionContext,
  clientOptions: LanguageClientOptions,
) {
  // Create a worker. The worker main file implements the language server.
  const serverMain = Uri.joinPath(
    context.extensionUri,
    "server/dist/browser/server.js",
  );
  const worker = new Worker(serverMain.toString());

  // create the language server client to communicate with the server running in the worker
  return new LanguageClient(
    "sas-lsp",
    "SAS Language Server",
    clientOptions,
    worker,
  );
}

const getUserRootFolder = () => {
  return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE || '';
};

export function deactivate(): Thenable<void> | undefined {
  const filePath = path.join(getUserRootFolder(), `vscode.heartbeat`);
  fs.writeFile(filePath, Date.now().toString(), (err) => {
    if (err) {
      console.error(err);
    }
  });

  if (!client) {
    return undefined;
  }
  return client.stop();
}
