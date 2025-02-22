import './createPost.js';

import { Devvit, useWebView } from '@devvit/public-api';

Devvit.configure({
  redditAPI: true,
  redis: true,
});

// Add a custom post type to Devvit
Devvit.addCustomPostType({
  name: 'Web View Example',
  height: 'tall',
  render: (context) => {
    // Load username with `useAsync` hook

    const webView = useWebView({
      // URL of your web view content
      url: 'page2.html?t='+(+new Date),

      // Handle messages sent from the web view
      async onMessage(message, webView) { },
      onUnmount() {
        context.ui.showToast('Web view closed!');
      },
    });

    // Render the custom post type
    return (
      <vstack grow padding="small">
        <button onPress={() => webView.mount()}>Launch App</button>
      </vstack>
    );
  },
});

export default Devvit;
