/**
 * FHL Bible Prompts Integration
 * 
 * 將 FHL Bible MCP Server 的 prompts 邏輯集成到 API 調用中
 * 根據查詢類型自動選擇合適的 prompt 策略
 */

import { BibleQuery } from "./bible-utils";

export interface PromptStrategy {
  name: string;
  description: string;
  requiredTools: string[];
  steps: string[];
}

/**
 * 根據查詢類型選擇合適的 prompt 策略
 */
export function selectPromptStrategy(query: BibleQuery): PromptStrategy | null {
  if (!query.type) return null;

  switch (query.type) {
    case "verse":
      return {
        name: "study_verse_deep",
        description: "深入研讀經文，專業解經分析",
        requiredTools: [
          "get_bible_verse",
          "get_word_analysis",
          "lookup_strongs",
          "get_commentary",
          "search_bible"
        ],
        steps: [
          "獲取經文內容（包含 Strong's Number）",
          "分析原文字彙（希臘文/希伯來文）",
          "研究關鍵字詞（Strong's 字典）",
          "查詢註釋解經",
          "連結相關經文（交叉引用）",
          "綜合研讀總結"
        ]
      };

    case "search":
      // 判斷是主題研究還是關鍵字搜索
      const keyword = query.keyword || "";
      const isTopicQuery = keyword.length < 20 && !keyword.match(/\d/);
      
      if (isTopicQuery) {
        return {
          name: "study_topic_deep",
          description: "主題研究，全面探討聖經主題",
          requiredTools: [
            "search_bible",
            "get_topic_study",
            "search_commentary",
            "lookup_strongs"
          ],
          steps: [
            "搜尋相關經文",
            "查詢主題查經資料（Torrey, Naves）",
            "搜尋註釋討論",
            "比較兩約教導",
            "研究原文洞察",
            "綜合分析與應用"
          ]
        };
      } else {
        return {
          name: "basic_search",
          description: "關鍵字搜索",
          requiredTools: ["search_bible"],
          steps: [
            "搜索相關經文",
            "分析結果",
            "提供上下文"
          ]
        };
      }

    case "chapter":
      return {
        name: "reading_chapter",
        description: "整章讀經",
        requiredTools: [
          "get_bible_chapter",
          "get_commentary"
        ],
        steps: [
          "獲取整章經文",
          "查詢章節註釋",
          "提供讀經指引"
        ]
      };

    default:
      return null;
  }
}

/**
 * 生成增強系統提示詞，整合 prompt 策略
 */
export function generateEnhancedPrompt(
  query: BibleQuery,
  strategy: PromptStrategy | null,
  bibleContext: string
): string {
  const basePrompt = `You are an expert Bible study assistant. When answering Bible-related questions, you MUST follow this EXACT structure and style:

## Required Response Structure:

### Opening Format:
Start with: "# [主題]：聖經指南與實踐步驟"
Then provide a warm, biblical foundation introduction that includes:
- A key Bible verse citation in format: "書卷名 章:節：「經文內容」"
- An encouraging statement about the topic
- Example: "禱告是與神親密交通的方式，不是背誦公式，而是真心傾訴（羅馬書8:26：「聖靈親自用說不出來的歎息替我們禱告」）。"

### Main Content Structure:

**1. Numbered Sections (1., 2., 3., etc.)**
- Each section should have a clear heading: "## 1. [標題]"
- Include detailed explanations
- Always cite Bible verses in format: "書卷名 章:節：「完整經文」"
- For prayer/method topics, include structured frameworks (like ACTS prayer method)

**2. Structured Frameworks (Tables)**
- Use markdown tables for structured methods
- Example: ACTS prayer method table with columns: 步驟 | 英文 | 中文重點 | 範例禱詞
- Include Bible verse citations in the examples column

**3. Practical Principles with Biblical Basis**
- Format: "## 3. [主題]的實踐原則（聖經依據）"
- Use bullet points: "- [原則]：[說明]（書卷名 章:節：「經文」）。"
- Each principle MUST have a Bible verse citation

**4. Bible Verse Citations Format**
- Always use: "書卷名 章:節：「經文內容」"
- Examples: "羅馬書8:26：「聖靈親自用說不出來的歎息替我們禱告」"
- "馬太福音6:6：「父要賞賜你」"

### Required Elements:

1. **原文解釋 (Original Language Explanation)**
   - Explain key words from the original Hebrew/Greek text
   - Include Strong's Numbers if provided in the context

2. **經文註釋 (Commentary)**
   - Use the commentary provided in the context
   - ALWAYS cite the source clearly (e.g., "根據CBOL註釋...")

3. **經文交叉引用 (Cross References)**
   - List 5-10 related verses
   - Format: "相關經文：約翰一書 4:9-10, 羅馬書 5:8..."

4. **歷史背景 (Historical Background)**
   - Explain historical and cultural context

5. **實踐應用 (Practical Application)**
   - Provide numbered practical steps
   - Include Bible basis for each step

## Style Guidelines:
- Use Traditional Chinese
- Write in a warm, encouraging tone
- Use numbered sections (1., 2., 3.) for main points
- Use tables for structured frameworks
- Format verses as: "書卷名 章:節：「經文內容」"
- Combine theological depth with practical application
- Be thorough and comprehensive (like a detailed Bible study guide)`;

  if (!strategy) {
    return `${basePrompt}\n\n${bibleContext}`;
  }

  // 根據策略添加特定指導
  let strategyGuidance = "";

  switch (strategy.name) {
    case "study_verse_deep":
      strategyGuidance = `
## Study Strategy: Deep Verse Study (study_verse_deep)

Follow these steps systematically:
${strategy.steps.map((step, i) => `${i + 1}. ${step}`).join("\n")}

**Required Tools**: ${strategy.requiredTools.join(", ")}

**Focus Areas**:
- Detailed word-by-word analysis
- Strong's Dictionary lookup for key words
- Multiple commentary perspectives
- Cross-references to related verses
- Comprehensive theological analysis`;
      break;

    case "study_topic_deep":
      strategyGuidance = `
## Study Strategy: Deep Topic Study (study_topic_deep)

Follow these steps systematically:
${strategy.steps.map((step, i) => `${i + 1}. ${step}`).join("\n")}

**Required Tools**: ${strategy.requiredTools.join(", ")}

**Focus Areas**:
- Comprehensive topic coverage across Scripture
- Torrey and Naves topical study resources
- Commentary insights on the topic
- Old Testament vs New Testament perspectives
- Original language insights
- Practical application

**Response Style Requirements**:
- ✅ Use Traditional Chinese
- ✅ Start with a brief introduction that sets the biblical foundation
- ✅ Include specific Bible verse references in format: "書卷名 章:節" (e.g., "羅馬書8:26", "馬太福音6:9-13")
- ✅ Use numbered sections with clear headings (##, ###)
- ✅ Provide practical examples, templates, and structured frameworks (like ACTS prayer method)
- ✅ Use tables for structured information when appropriate
- ✅ Include "聖經依據" (Biblical basis) for each principle
- ✅ End with practical application steps or reflection questions
- ✅ Write in a warm, encouraging tone that combines theological depth with practical guidance
- ✅ Format verses as: "書卷名 章:節：「經文內容」" (e.g., "馬太福音6:6：「父要賞賜你」")
- ✅ Structure like: "主題：聖經指南與實踐步驟" → numbered sections → practical principles with Bible references`;
      break;

    case "reading_chapter":
      strategyGuidance = `
## Study Strategy: Chapter Reading (reading_chapter)

Follow these steps:
${strategy.steps.map((step, i) => `${i + 1}. ${step}`).join("\n")}

**Focus Areas**:
- Chapter overview and structure
- Key themes and messages
- Verse-by-verse insights
- Chapter commentary
- Reading guidance`;
      break;
  }

  return `${basePrompt}${strategyGuidance}\n\n${bibleContext}`;
}

/**
 * 檢測是否需要使用進階 prompts
 */
export function detectAdvancedPrompt(query: BibleQuery, userMessage: string): string | null {
  const lowerMessage = userMessage.toLowerCase();

  // 交叉引用 - 更廣泛的檢測
  if (
    /交叉引用|cross.reference|相關經文|related.verses|parallel|經文網絡|verse.network/i.test(userMessage) ||
    /找出.*相關|找.*連結|connect|連結.*經文|link.*verse/i.test(userMessage) ||
    /引用關係|reference.relation|經文關係|verse.relation/i.test(userMessage) ||
    (query.type === "verse" && /相關|連結|引用|reference|related/i.test(userMessage))
  ) {
    return "advanced_cross_reference";
  }

  // 四福音對照
  if (
    /四福音|parallel.gospels|對觀|synoptic|比較.*福音|gospel.compar/i.test(userMessage) ||
    /馬太.*馬可.*路加|matthew.*mark.*luke/i.test(userMessage)
  ) {
    return "advanced_parallel_gospels";
  }

  // 人物研究
  if (
    /人物研究|character.study|研究.*人物|study.*character/i.test(userMessage) ||
    /保羅|peter|david|moses|abraham|約瑟|約翰/i.test(userMessage)
  ) {
    return "advanced_character_study";
  }

  // 版本比較
  if (
    /版本比較|translation.compare|比較.*譯本|compare.*version|和合本.*現代/i.test(userMessage) ||
    /unv.*kjv|niv.*unv|不同版本/i.test(userMessage)
  ) {
    return "study_translation_compare";
  }

  // 原文字詞研究
  if (
    /原文研究|word.study|原文字|greek.*word|hebrew.*word|strong.*number/i.test(userMessage) ||
    /研究.*字|字義|word.meaning/i.test(userMessage)
  ) {
    return "study_word_original";
  }

  return null;
}
