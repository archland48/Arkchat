# Bible Study Chatbot 📖

A Next.js-based Bible study chatbot integrated with FHL Bible API (信望愛站聖經 API).

## Features

### ✨ Core Features

- **📖 Verse Query**: Query specific Bible verses (e.g., "約翰福音 3:16" or "John 3:16")
- **📚 Chapter Reading**: Read entire chapters (e.g., "創世記 1" or "Genesis 1")
- **🔍 Keyword Search**: Search Bible by keywords (e.g., "search for 愛" or "搜尋 信心")
- **💬 AI-Powered Discussion**: Ask questions about Bible verses and get contextual answers
- **⚡ Real-time Streaming**: Get instant responses with streaming support
- **🎨 Modern UI**: Beautiful, ChatGPT-like interface optimized for Bible study

### 🚀 Quick Actions

The chatbot includes quick action buttons for common Bible queries:
- 約翰福音 3:16
- 馬太福音 5:3-10
- 創世記 1
- Search for 愛
- Search for 信心

## How It Works

### Architecture

1. **FHL API Integration** (`lib/fhl-api.ts`)
   - Direct integration with FHL Bible API (https://bible.fhl.net/json/)
   - Supports verse queries, chapter reading, keyword search, and more
   - Based on official API documentation: https://bible.fhl.net/api/

2. **Bible Query Detection** (`lib/bible-utils.ts`)
   - Automatically detects Bible queries in user messages
   - Parses verse references, chapter references, and search queries
   - Formats Bible data for AI context

3. **Enhanced Chat API** (`app/api/chat/route.ts`)
   - Detects Bible queries from user messages
   - Fetches Bible data from FHL API
   - Adds Bible context to AI prompts
   - Returns AI-generated responses with Bible context

4. **Bible API Route** (`app/api/bible/route.ts`)
   - Standalone API endpoint for Bible queries
   - Supports multiple actions: verse, chapter, search, versions, word-analysis

## Usage Examples

### Query a Verse

```
User: 約翰福音 3:16
```

The chatbot will:
1. Detect the Bible query
2. Fetch the verse from FHL API
3. Add it to the AI context
4. Generate a response explaining the verse

### Read a Chapter

```
User: 創世記 1
```

The chatbot will fetch and display the entire chapter with AI commentary.

### Search by Keyword

```
User: search for 愛
User: 搜尋 信心
```

The chatbot will search the Bible and provide relevant verses with context.

### Ask Questions

```
User: What does the Bible say about love?
User: 聖經關於信心的教導是什麼？
```

The chatbot will search for relevant verses and provide comprehensive answers.

## API Endpoints

### `/api/bible`

Query Bible data directly:

```typescript
// Get a verse
GET /api/bible?action=verse&book=約&chapter=3&verse=16

// Get a chapter
GET /api/bible?action=chapter&book=創&chapter=1

// Search
GET /api/bible?action=search&keyword=愛

// Get Bible versions
GET /api/bible?action=versions

// Word analysis
GET /api/bible?action=word-analysis&book=約&chapter=3&verse=16
```

### `/api/chat`

Enhanced chat endpoint with automatic Bible query detection:

```typescript
POST /api/chat
{
  "messages": [
    { "role": "user", "content": "約翰福音 3:16" }
  ],
  "model": "grok-4-fast"
}
```

## Supported Book Formats

The chatbot supports both Chinese and English book names:

- **Chinese**: 約翰福音, 約, 馬太福音, 太, 創世記, 創, etc.
- **English**: John, Matthew, Genesis, etc.

## Bible Versions

Default version: `unv` (和合本)

Supported versions can be queried via `/api/bible?action=versions`

## Technical Details

### Dependencies

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- OpenAI SDK (for AI Builder API)

### FHL API Integration

Based on official FHL Bible API documentation:
- Base URL: `https://bible.fhl.net/json/`
- API Documentation: https://bible.fhl.net/api/
- Supports multiple endpoints: `qb.php`, `qp.php`, `search.php`, etc.

### Query Detection Patterns

The chatbot uses regex patterns to detect:
- Verse references: `book chapter:verse`
- Chapter references: `book chapter`
- Search queries: `search for keyword` or `搜尋 keyword`

## Development

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

## Environment Variables

Required:
- `AI_BUILDER_TOKEN`: Your AI Builder API token

## Future Enhancements

- [ ] Support for more Bible versions
- [ ] Strong's Number integration
- [ ] Commentary integration
- [ ] Cross-reference support
- [ ] Audio Bible integration
- [ ] Bookmark and notes feature
- [ ] Reading plans

## Credits

- **FHL Bible API**: 信望愛站 (https://bible.fhl.net/)
- **AI Builder**: For AI-powered responses
- **Next.js**: React framework

## License

MIT

---

**Made with ❤️ for Bible study and research**
