# LSP Test Client

## Overview

This project is a **Language Server Protocol (LSP) Test Client** that allows interaction with multiple language servers over WebSockets. It supports dynamic switching between language servers based on the selected language.

## Features

- Connects to different LSP servers via WebSockets.
- Supports Python and Java language servers.
- Sends LSP requests and receives responses.
- Displays diagnostics and other language features.

## Installation

### Prerequisites

- The Java language server requires a runtime environment of Java 21 (at a minimum) to run.
- **Node.js** (>= 14.x recommended)
- **npm** or **yarn**
- To test the Python language server, install Pyright globally:

```sh
npm install -g pyright
```

### Setup

1. Clone the repository.
2. Install server dependencies:
   ```sh
   cd server
   npm install
   ```
3. Start the WebSocket server:
   ```sh
   npm run build
   npm run start
   ```
4. Install client dependencies:
   ```sh
   cd client
   npm install
   ```
5. Start the client:
   ```sh
   npm run dev
   ```

## Configuration

The language server settings are configured in `config.ts`:

```ts
export const CONFIG: Config = {
  [Language.JAVA]: {
    languageId: Language.JAVA,
    fileUri: 'file:///path/to/java-project/Main.java', // Change this path
    wsServerURL: 'ws://localhost:3000/java',
  },
  [Language.PYTHON]: {
    languageId: Language.PYTHON,
    fileUri: 'file:///path/to/python-project/example.py', // Change this path
    wsServerURL: 'ws://localhost:3000/python',
  },
};
```

## Usage

1. Open the test client in the browser.
2. Select a language (Python or Java).
3. Type your code in the editor (or copy & paste it from the corresponding project files).
4. Use the available actions to send LSP requests. (Note: Some actions, such as semantic tokens, are not supported by the Python language server.)
5. The **`Parsed Data`** request is a **custom** request (not a standard LSP request) designed to retrieve data that can be used in the **Code Explorer in 5Code**. It combines multiple LSP requests.
6. View responses and diagnostics in the UI.
