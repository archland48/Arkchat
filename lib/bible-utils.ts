/**
 * Bible Query Detection and Parsing Utilities
 */

export interface BibleQuery {
  type: "verse" | "chapter" | "search" | null;
  book?: string;
  chapter?: number;
  verse?: string;
  keyword?: string;
}

/**
 * Detect if a message contains a Bible query
 * Supports formats like:
 * - "約翰福音 3:16"
 * - "John 3:16"
 * - "創世記 1"
 * - "search for love"
 */
export function detectBibleQuery(message: string): BibleQuery {
  const lowerMessage = message.toLowerCase().trim();

  // Check for verse reference patterns
  // Pattern: book chapter:verse or book chapter verse
  const versePatterns = [
    /(?:約翰福音|約|john|joh)\s*(\d+)[:：]\s*(\d+(?:-\d+)?(?:,\d+)*)/i,
    /(?:馬太福音|太|matthew|mat)\s*(\d+)[:：]\s*(\d+(?:-\d+)?(?:,\d+)*)/i,
    /(?:馬可福音|可|mark|mar)\s*(\d+)[:：]\s*(\d+(?:-\d+)?(?:,\d+)*)/i,
    /(?:路加福音|路|luke|luk)\s*(\d+)[:：]\s*(\d+(?:-\d+)?(?:,\d+)*)/i,
    /(?:創世記|創|genesis|gen)\s*(\d+)[:：]\s*(\d+(?:-\d+)?(?:,\d+)*)/i,
    /(?:出埃及記|出|exodus|exo)\s*(\d+)[:：]\s*(\d+(?:-\d+)?(?:,\d+)*)/i,
    // Add more book patterns as needed
  ];

  for (const pattern of versePatterns) {
    const match = message.match(pattern);
    if (match) {
      const bookMatch = message.match(/^(約翰福音|約|john|joh|馬太福音|太|matthew|mat|馬可福音|可|mark|mar|路加福音|路|luke|luk|創世記|創|genesis|gen|出埃及記|出|exodus|exo)/i);
      if (bookMatch) {
        return {
          type: "verse",
          book: bookMatch[1],
          chapter: parseInt(match[1]),
          verse: match[2],
        };
      }
    }
  }

  // Check for chapter reference (book chapter without verse)
  const chapterPattern = /(?:約翰福音|約|john|joh|馬太福音|太|matthew|mat|創世記|創|genesis|gen)\s*(\d+)(?![:：\d])/i;
  const chapterMatch = message.match(chapterPattern);
  if (chapterMatch) {
    const bookMatch = message.match(/^(約翰福音|約|john|joh|馬太福音|太|matthew|mat|創世記|創|genesis|gen)/i);
    if (bookMatch) {
      return {
        type: "chapter",
        book: bookMatch[1],
        chapter: parseInt(chapterMatch[1]),
      };
    }
  }

  // Check for search keywords
  const searchKeywords = [
    /(?:search|搜尋|查找|找|查詢)\s+(?:for|關於|有關)?\s*(.+)/i,
    /(?:what does the bible say about|聖經關於|聖經說|經文關於)\s+(.+)/i,
  ];

  for (const pattern of searchKeywords) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return {
        type: "search",
        keyword: match[1].trim(),
      };
    }
  }

  // Comprehensive Bible and faith-related keywords - PRIORITY DETECTION
  const bibleStudyKeywords = [
    "bible", "聖經", "經文", "verse", "chapter", "gospel", "福音",
    "scripture", "scriptures", "testament", "舊約", "新約", "old testament", "new testament", "ot", "nt",
    "約", "太", "可", "路", "創", "出", "書", "記", "篇", "章",
  ];

  // Comprehensive Bible theme keywords (100+ keywords)
  const bibleThemeKeywords = [
    // Love and relationships
    "愛", "love", "愛人", "愛神", "愛心", "慈愛", "仁愛", "愛主", "愛鄰舍", "愛仇敵",
    // Faith and salvation
    "信心", "faith", "信", "救恩", "salvation", "拯救", "得救", "信主", "信靠", "信實",
    // Gospel and evangelism
    "福音", "gospel", "傳福音", "evangelism", "佈道", "宣教", "mission", "傳道",
    // Prayer and worship
    "禱告", "prayer", "祈禱", "敬拜", "worship", "讚美", "praise", "感恩", "thanksgiving", "頌讚",
    // Sin and forgiveness
    "罪", "sin", "赦免", "forgiveness", "饒恕", "悔改", "repentance", "認罪", "犯罪",
    // Grace and mercy
    "恩典", "grace", "憐憫", "mercy", "恩惠", "favor", "恩賜", "gift",
    // Hope and peace
    "希望", "hope", "盼望", "平安", "peace", "shalom", "安慰", "comfort", "安息", "rest",
    // God and Jesus
    "神", "god", "上帝", "耶穌", "jesus", "基督", "christ", "主", "lord", "lord jesus",
    "天父", "father", "creator", "創造主", "救主", "savior", "彌賽亞", "messiah",
    // Holy Spirit
    "聖靈", "holy spirit", "spirit", "保惠師", "comforter", "聖靈充滿",
    // Church and community
    "教會", "church", "團契", "fellowship", "弟兄", "sister", "brother", "姐妹",
    "牧師", "pastor", "傳道", "preacher", "長老", "elder", "執事", "deacon",
    // Other common themes
    "真理", "truth", "生命", "life", "死亡", "death", "永生", "eternal life", "復活的生命",
    "復活", "resurrection", "天國", "kingdom", "天堂", "heaven", "天", "sky", "天家",
    "地獄", "hell", "審判", "judgment", "審判日", "last day", "末日", "最後審判",
    "十字架", "cross", "釘十字架", "crucifixion", "受難", "passion",
    "使徒", "apostle", "門徒", "disciple", "先知", "prophet", "預言", "prophecy",
    "約", "covenant", "應許", "promise", "祝福", "blessing", "咒詛", "curse",
    "試煉", "trial", "試探", "temptation", "苦難", "suffering", "患難", "tribulation", "逼迫", "persecution",
    "得勝", "victory", "勝利", "爭戰", "war", "屬靈", "spiritual", "屬靈爭戰",
    "成聖", "sanctification", "聖潔", "holy", "holiness", "分別為聖",
    "奉獻", "offering", "獻祭", "sacrifice", "十一奉獻", "tithe", "什一",
  ];

  // Faith and Christianity related keywords
  const faithKeywords = [
    "信仰", "faith", "belief", "believer", "基督徒", "christian", "christianity", "基督信仰",
    "宗教", "religion", "religious", "靈性", "spiritual", "spirituality", "屬靈",
    "靈修", "devotion", "devotional", "靈修生活", "quiet time",
    "讀經", "bible reading", "查經", "bible study", "研經", "讀聖經",
    "默想", "meditation", "meditate", "默想神的話",
    "見證", "testimony", "testify", "分享", "share", "sharing", "見證分享",
    "服事", "serve", "service", "事奉", "ministry", "ministries", "事工",
    "宣教", "mission", "missionary", "差傳", "missions", "宣教士",
    "神學", "theology", "theological", "教義", "doctrine", "神學思想",
    "講道", "sermon", "preach", "preaching", "信息", "message", "講章",
    "聚會", "meeting", "禮拜", "service", "主日", "sunday", "主日崇拜",
    "受洗", "baptism", "baptize", "洗禮", "浸禮", "受浸",
    "聖餐", "communion", "eucharist", "主餐", "lord's supper", "掰餅",
    "奉獻", "offering", "give", "giving", "捐獻", "donation", "奉獻金",
  ];

  // Check if message contains Bible study keywords (word boundary matching)
  const hasBibleKeyword = bibleStudyKeywords.some((keyword) => {
    const keywordLower = keyword.toLowerCase();
    // Use word boundary for better matching
    const regex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(lowerMessage);
  });

  // Check if message contains Bible theme keywords
  // For Chinese characters, use simple includes() instead of word boundary
  const hasThemeKeyword = bibleThemeKeywords.some((keyword) => {
    const keywordLower = keyword.toLowerCase();
    // For Chinese characters (no word boundaries), use includes
    // For English words, use word boundary regex
    if (/[\u4e00-\u9fa5]/.test(keyword)) {
      // Chinese character - use simple includes
      return lowerMessage.includes(keywordLower);
    } else {
      // English word - use word boundary
      const regex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(lowerMessage);
    }
  });

  // Check if message contains faith-related keywords
  // For Chinese characters, use simple includes() instead of word boundary
  const hasFaithKeyword = faithKeywords.some((keyword) => {
    const keywordLower = keyword.toLowerCase();
    // For Chinese characters (no word boundaries), use includes
    // For English words, use word boundary regex
    if (/[\u4e00-\u9fa5]/.test(keyword)) {
      // Chinese character - use simple includes
      return lowerMessage.includes(keywordLower);
    } else {
      // English word - use word boundary
      const regex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(lowerMessage);
    }
  });

  // Check if message is a question about Bible/faith (common question patterns)
  // Enhanced: Also check if question word + Bible theme keyword
  const questionWords = /(什麼|什麼是|什麼意思|如何|怎樣|為什麼|為何|who|what|how|why|where|when|explain|tell me about)/i;
  const bibleCoreKeywords = /(聖經|bible|神|god|上帝|耶穌|jesus|基督|christ|主|lord|信仰|faith|福音|gospel|教會|church)/i;
  
  const isBibleQuestion = 
    // Pattern 1: Question word + Bible core keyword
    (questionWords.test(message) && bibleCoreKeywords.test(message)) ||
    // Pattern 2: Question word + Bible theme keyword (禱告, 愛, 信心等)
    (questionWords.test(message) && (hasThemeKeyword || hasFaithKeyword)) ||
    // Pattern 3: Bible core keyword + Question word
    (bibleCoreKeywords.test(message) && questionWords.test(message));

  // Check if message is a single Bible theme keyword or short query
  const trimmedMessage = message.trim();
  const isSingleKeyword = bibleThemeKeywords.some((keyword) => {
    const keywordLower = keyword.toLowerCase();
    const trimmedLower = trimmedMessage.toLowerCase();
    // Exact match or message starts/ends with keyword (with word boundary)
    return trimmedLower === keywordLower ||
           trimmedLower.startsWith(keywordLower + " ") ||
           trimmedLower.endsWith(" " + keywordLower) ||
           new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(trimmedLower);
  });

  // STRICT MODE: Only treat as Bible search if:
  // 1. Contains explicit Bible core keywords (聖經, bible, 經文, verse, etc.)
  // 2. OR is a clear Bible question (question word + Bible core keyword)
  // 3. OR is a single Bible theme keyword (for short queries)
  // 
  // DO NOT treat vague theme keywords (like "愛", "信心") as Bible queries
  // unless they appear with Bible core keywords or in Bible context
  
  // Only return search type if:
  // - Has explicit Bible core keywords (聖經, bible, 經文, verse, chapter, gospel, etc.)
  // - OR is a Bible question (question word + Bible core keyword)
  // - OR is a single short Bible keyword query
  
  const hasExplicitBibleKeyword = hasBibleKeyword; // Only core Bible terms
  const isExplicitBibleQuestion = questionWords.test(message) && bibleCoreKeywords.test(message);
  
  if (hasExplicitBibleKeyword || isExplicitBibleQuestion || (isSingleKeyword && hasBibleKeyword)) {
    // Only treat as search if message is reasonably short or contains explicit Bible keywords
    if (trimmedMessage.length < 200 || hasExplicitBibleKeyword) {
      return {
        type: "search",
        keyword: trimmedMessage,
      };
    }
  }

  return { type: null };
}

/**
 * Format Bible verse data for AI context
 */
export function formatBibleContext(verseData: any): string {
  if (!verseData || !verseData.record || verseData.record.length === 0) {
    return "";
  }

  const verses = verseData.record;
  const version = verseData.v_name || verseData.version || "unknown";
  
  let context = `\n\n[Bible Reference - ${version}]\n`;
  
  verses.forEach((verse: any) => {
    context += `${verse.chineses || verse.engs} ${verse.chap}:${verse.sec}\n`;
    context += `${verse.bible_text}\n\n`;
  });

  return context;
}

/**
 * Format Bible search results for AI context
 */
export function formatBibleSearchContext(searchData: any): string {
  if (!searchData || !searchData.record || searchData.record.length === 0) {
    return "";
  }

  const results = searchData.record.slice(0, 10); // Limit to 10 results
  let context = `\n\n[Bible Search Results - Found ${searchData.record_count} results]\n`;
  
  results.forEach((verse: any) => {
    context += `${verse.chineses || verse.engs} ${verse.chap}:${verse.sec}\n`;
    context += `${verse.bible_text}\n\n`;
  });

  if (searchData.record_count > 10) {
    context += `\n... and ${searchData.record_count - 10} more results\n`;
  }

  return context;
}

/**
 * Format commentary data for AI context
 */
export function formatCommentaryContext(commentaryData: any): string {
  if (!commentaryData || !commentaryData.record || commentaryData.record.length === 0) {
    return "";
  }

  const commentaries = commentaryData.record.slice(0, 5); // Limit to 5 commentaries
  let context = `\n\n[Bible Commentary]\n`;
  
  commentaries.forEach((commentary: any) => {
    if (commentary.commentary_name) {
      context += `[${commentary.commentary_name}]\n`;
    }
    if (commentary.commentary_text) {
      context += `${commentary.commentary_text}\n\n`;
    }
  });

  return context;
}

/**
 * Format word analysis data for AI context
 */
export function formatWordAnalysisContext(wordData: any): string {
  if (!wordData || !wordData.record || wordData.record.length === 0) {
    return "";
  }

  let context = `\n\n[Original Language Word Analysis]\n`;
  
  wordData.record.forEach((word: any) => {
    if (word.word) {
      context += `Word: ${word.word}\n`;
    }
    if (word.strongs_number) {
      context += `Strong's Number: ${word.strongs_number}\n`;
    }
    if (word.meaning) {
      context += `Meaning: ${word.meaning}\n`;
    }
    if (word.grammar) {
      context += `Grammar: ${word.grammar}\n`;
    }
    context += `\n`;
  });

  return context;
}
