/** @typedef {import('../src/message.ts').DevvitSystemMessage} DevvitSystemMessage */
/** @typedef {import('../src/message.ts').WebViewMessage} WebViewMessage */

class App {
  constructor() {
    // When the Devvit app sends a message with `postMessage()`, this will be triggered
    addEventListener('message', this.#onMessage);
    // This event gets called when the web view is loaded
    addEventListener('load', () => {
      postWebViewMessage({ type: 'webViewReady' });
    });

  }

  /**
   * @arg {MessageEvent<DevvitSystemMessage>} ev
   * @return {void}
   */
  #onMessage = (ev) => {
   
  };
}

/**
 * Sends a message to the Devvit app.
 * @arg {WebViewMessage} msg
 * @return {void}
 */
function postWebViewMessage(msg) {
  parent.postMessage(msg, '*');
}

new App();
