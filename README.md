# ChatGPT Clone

A modern ChatGPT clone built with Next.js, featuring a two-column interface with conversations sidebar and chat area. Uses the AI Builder's API with the Grok model for fast responses.

## Features

- 🎨 Modern ChatGPT-like UI with dark theme
- 💬 Two-column layout: conversations sidebar + chat area
- 📝 Multiple conversation management
- ⚡ Real-time streaming responses
- 🚀 Fast responses using Grok-4-fast model
- 📱 Responsive design with mobile support

## Getting Started

### Prerequisites

- Node.js 18+ installed
- AI Builder Token (already configured in `.env.local`)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory with your AI Builder token:
```bash
AI_BUILDER_TOKEN=your_token_here
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
chatgpt-clone/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts      # API route for chat completions
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main page component
├── components/
│   ├── ChatArea.tsx          # Main chat area component
│   ├── ChatInput.tsx         # Message input component
│   ├── ChatMessage.tsx        # Individual message component
│   └── Sidebar.tsx           # Conversations sidebar
├── types/
│   └── index.ts              # TypeScript type definitions
└── package.json
```

## Usage

1. **Start a new conversation**: Click "New Chat" in the sidebar
2. **Send messages**: Type your message and press Enter or click the send button
3. **Switch conversations**: Click on any conversation in the sidebar
4. **Delete conversations**: Hover over a conversation and click the delete icon
5. **Mobile**: Use the hamburger menu to toggle the sidebar

## API Configuration

The app uses the AI Builder's API with the following configuration:
- Base URL: `https://space.ai-builders.com/backend/v1`
- Model: `grok-4-fast`
- Authentication: Bearer token via `AI_BUILDER_TOKEN` environment variable

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **OpenAI SDK** - For API communication (compatible with AI Builder's API)

## Deployment

To deploy this application to AI Builder's platform:

1. **Create a public GitHub repository** and push your code:
   ```bash
   git remote add origin https://github.com/yourusername/chatgpt-clone.git
   git push -u origin main
   ```

2. **Set the repository URL** and deploy:
   ```bash
   export REPO_URL=https://github.com/yourusername/chatgpt-clone
   export AI_BUILDER_TOKEN=your_token_here
   node deploy.js
   ```

   Or use the deployment API directly:
   ```bash
   curl -X POST https://space.ai-builders.com/backend/v1/deployments \
     -H "Authorization: Bearer $AI_BUILDER_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "repo_url": "https://github.com/yourusername/chatgpt-clone",
       "service_name": "chatgpt-clone",
       "branch": "main",
       "port": 3000
     }'
   ```

3. **Monitor deployment status**:
   ```bash
   curl https://space.ai-builders.com/backend/v1/deployments/chatgpt-clone \
     -H "Authorization: Bearer $AI_BUILDER_TOKEN"
   ```

The application will be available at: `https://chatgpt-clone.ai-builders.space`

## License

MIT
