import { NextRequest } from "next/server";
import OpenAI from "openai";
import { detectBibleQuery, formatBibleContext, formatBibleSearchContext, formatCommentaryContext, formatWordAnalysisContext } from "@/lib/bible-utils";
import { getBibleVerse, getBibleChapter, searchBible, parseBookName, getCommentary, getWordAnalysis } from "@/lib/fhl-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

// API timeout configuration (in milliseconds)
const API_TIMEOUT = 25000; // 25 seconds for AI Builder API
const BIBLE_API_TIMEOUT = 8000; // 8 seconds for Bible API calls

// Helper function to add timeout to promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

const openai = new OpenAI({
  baseURL: "https://space.ai-builders.com/backend/v1",
  apiKey: process.env.AI_BUILDER_TOKEN,
  defaultHeaders: {
    "Authorization": `Bearer ${process.env.AI_BUILDER_TOKEN}`,
  },
  timeout: API_TIMEOUT,
});

export async function POST(req: NextRequest) {
  try {
    // Check if API key is configured
    const apiToken = process.env.AI_BUILDER_TOKEN;
    if (!apiToken) {
      console.error("AI_BUILDER_TOKEN is not configured");
      return new Response(
        JSON.stringify({ error: "API token not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Log token status (first 20 chars only for security)
    console.log("API Token status:", apiToken ? `Configured (${apiToken.substring(0, 20)}...)` : "NOT configured");

    const { messages, model = "grok-4-fast", bibleModeEnabled = false } = await req.json();
    
    // Validate model
    const validModels = ["grok-4-fast", "supermind-agent-v1"];
    const selectedModel = validModels.includes(model) ? model : "grok-4-fast";
    
    // Detect Bible query from the last user message
    const lastMessage = messages[messages.length - 1];
    let bibleContext = "";
    let isBibleQuery = false;
    
    // IMPORTANT: For supermind-agent-v1, skip automatic Bible query detection UNLESS Bible Mode is explicitly enabled
    // If Bible Mode is enabled by user, always fetch Bible data regardless of model
    // If Bible Mode is disabled, let supermind-agent-v1 decide when to use tools
    const shouldSkipBibleDetection = selectedModel === "supermind-agent-v1" && !bibleModeEnabled;
    
    // Priority: If Bible mode is enabled OR a Bible query is detected, process as Bible query
    if (lastMessage && lastMessage.role === "user" && !shouldSkipBibleDetection) {
      const bibleQuery = detectBibleQuery(lastMessage.content);
      
      // Only process Bible queries if:
      // 1. Bible mode is explicitly enabled, OR
      // 2. A clear Bible query pattern is detected (verse, chapter, or explicit search)
      // Skip vague keyword matches for non-Bible queries
      const isExplicitBibleQuery = bibleQuery.type === "verse" || 
                                    bibleQuery.type === "chapter" || 
                                    (bibleQuery.type === "search" && bibleModeEnabled);
      
      // If Bible mode is enabled, treat ALL queries as Bible queries
      if (bibleModeEnabled && bibleQuery.type === null) {
        // Force treat as search query when Bible mode is enabled
        isBibleQuery = true;
        try {
          // Add timeout to Bible API calls
          const searchData = await withTimeout(
            searchBible(lastMessage.content, "unv", 15, false),
            BIBLE_API_TIMEOUT,
            "Bible search timed out"
          );
          bibleContext += formatBibleSearchContext(searchData);
          
          // Also get topic study and commentary (parallel with timeout)
          try {
            const { getTopicStudy, searchCommentary } = await import("@/lib/fhl-api");
            const [topicData, commentarySearch] = await Promise.allSettled([
              withTimeout(
                getTopicStudy(lastMessage.content, "all", false, false),
                BIBLE_API_TIMEOUT,
                "Topic study timed out"
              ),
              withTimeout(
                searchCommentary(lastMessage.content, undefined, false),
                BIBLE_API_TIMEOUT,
                "Commentary search timed out"
              )
            ]);
            
            if (topicData.status === 'fulfilled' && topicData.value.record && topicData.value.record.length > 0) {
              let topicContext = "\n\n[Topic Study Resources - 主題查經資料]\n";
              topicData.value.record.slice(0, 5).forEach((entry: any) => {
                const sourceName = entry.book === 0 ? "Torrey (English)" :
                                 entry.book === 1 ? "Naves (English)" :
                                 entry.book === 2 ? "Torrey (中文)" :
                                 entry.book === 3 ? "Naves (中文)" : "Unknown";
                topicContext += `[${sourceName}] ${entry.topic || ""}\n${entry.text || ""}\n\n`;
              });
              bibleContext += topicContext;
            }
            
            if (commentarySearch.status === 'fulfilled' && commentarySearch.value.results && commentarySearch.value.results.length > 0) {
              let commentaryContext = "\n\n[Commentary Search Results - 註釋搜尋結果]\n";
              commentarySearch.value.results.slice(0, 5).forEach((result: any) => {
                commentaryContext += `[${result.commentary_name || "註釋"}] ${result.book} ${result.chapter_start}:${result.verse_start}\n${result.title || ""}\n\n`;
              });
              bibleContext += commentaryContext;
            }
          } catch (error) {
            console.error("Error fetching additional Bible resources:", error);
          }
        } catch (error) {
          console.error("Error searching Bible:", error);
        }
      }
      
      // Process Bible queries (only if explicit Bible query detected)
      // Skip if it's just a vague keyword match without explicit Bible context
      if (isExplicitBibleQuery && (bibleModeEnabled || bibleQuery.type !== null)) {
      
      if (bibleQuery.type === "verse" && bibleQuery.book && bibleQuery.chapter) {
        isBibleQuery = true;
        try {
          const bookId = parseBookName(bibleQuery.book);
          if (bookId) {
            // Get verse data with Strong's numbers for original language analysis (with timeout)
            const verseData = await withTimeout(
              getBibleVerse(
                bookId,
                bibleQuery.chapter,
                bibleQuery.verse,
                "unv",
                true, // Include Strong's Number for original language explanation
                false
              ),
              BIBLE_API_TIMEOUT,
              "Verse fetch timed out"
            );
            bibleContext += formatBibleContext(verseData);
            
            // study_verse_deep - 深入研讀經文
            // Get commentary and word analysis if verse number is specified
            if (bibleQuery.verse) {
              try {
                const verseNum = parseInt(bibleQuery.verse.split('-')[0].split(',')[0]);
                if (!isNaN(verseNum)) {
                  // study_verse_deep Step 2: 分析原文字彙 (get_word_analysis)
                  // study_verse_deep Step 3: 研究關鍵字詞 (lookup_strongs)
                  // study_verse_deep Step 4: 查詢註釋解經 (get_commentary)
                  
                  // Fetch word analysis and commentary in parallel (with timeout)
                  const [wordData, commentaryData] = await Promise.allSettled([
                    withTimeout(
                      getWordAnalysis(bookId, bibleQuery.chapter, verseNum),
                      BIBLE_API_TIMEOUT,
                      "Word analysis timed out"
                    ),
                    withTimeout(
                      getCommentary(bookId, bibleQuery.chapter, verseNum),
                      BIBLE_API_TIMEOUT,
                      "Commentary fetch timed out"
                    )
                  ]);
                  
                  // Process word analysis
                  if (wordData.status === 'fulfilled' && wordData.value && wordData.value.record && wordData.value.record.length > 0) {
                    const wordDataValue = wordData.value;
                    bibleContext += formatWordAnalysisContext(wordDataValue);
                    
                    // Step 3: Lookup Strong's Dictionary for key words
                    try {
                      const { lookupStrongs } = await import("@/lib/fhl-api");
                      const verseText = verseData.record?.[0]?.bible_text || "";
                      
                      // Extract Strong's numbers from word analysis
                      const strongsNumbers = new Set<string>();
                      wordDataValue.record.forEach((word: any) => {
                        if (word.strongs) {
                          // Parse Strong's number format (e.g., "G3056", "H430")
                          const strongsMatch = word.strongs.match(/([GH])(\d+)/i);
                          if (strongsMatch) {
                            const testament = strongsMatch[1].toUpperCase() === "G" ? "NT" : "OT";
                            const number = strongsMatch[2];
                            strongsNumbers.add(`${strongsMatch[1]}${number}`);
                          }
                        }
                      });
                      
                      // Lookup top 3-5 Strong's numbers (with timeout)
                      if (strongsNumbers.size > 0) {
                        const strongsLookups = await Promise.allSettled(
                          Array.from(strongsNumbers).slice(0, 5).map((strongsNum) => {
                            const testament = strongsNum.startsWith("G") ? "NT" : "OT";
                            return withTimeout(
                              lookupStrongs(strongsNum, testament, false),
                              BIBLE_API_TIMEOUT,
                              `Strong's lookup timed out for ${strongsNum}`
                            );
                          })
                        );
                        
                        let strongsContext = "\n\n[study_verse_deep - Step 3: Strong's Dictionary Lookup - Strong's 字典查詢]\n";
                        strongsLookups.forEach((result, idx) => {
                          if (result.status === 'fulfilled' && result.value) {
                            const strongsNum = Array.from(strongsNumbers)[idx];
                            const strongsData = result.value;
                            strongsContext += `\nStrong's ${strongsNum}:\n`;
                            if (strongsData.record && strongsData.record.length > 0) {
                              const entry = strongsData.record[0];
                              strongsContext += `原文: ${entry.orig || ""}\n`;
                              strongsContext += `音譯: ${entry.trans || ""}\n`;
                              strongsContext += `字義: ${entry.meaning || ""}\n`;
                              if (entry.usage) {
                                strongsContext += `用法: ${entry.usage.substring(0, 200)}...\n`;
                              }
                              strongsContext += "\n";
                            }
                          }
                        });
                        bibleContext += strongsContext;
                      }
                    } catch (error) {
                      console.error("Error looking up Strong's dictionary:", error);
                    }
                  } else if (wordData.status === 'rejected') {
                    console.error("Error fetching word analysis:", wordData.reason);
                  }
                  
                  // Step 4: Process commentary (already fetched in parallel)
                  if (commentaryData.status === 'fulfilled' && commentaryData.value && commentaryData.value.record && commentaryData.value.record.length > 0) {
                    bibleContext += formatCommentaryContext(commentaryData.value);
                  } else if (commentaryData.status === 'rejected') {
                    console.error("Error fetching commentary:", commentaryData.reason);
                  }
                  
                  // Advanced Cross-Reference: Three-layer analysis
                  try {
                    const verseText = verseData.record?.[0]?.bible_text || "";
                    if (verseText) {
                      // Check if user explicitly requested cross-reference analysis
                      const userMessage = lastMessage.content.toLowerCase();
                      const needsAdvancedCrossRef = /(交叉引用|相關經文|經文網絡|引用關係|經文關係|找出相關|找連結|連結經文|cross reference|related verses|verse network|reference relation|verse relation|connect|link verse)/i.test(userMessage);
                      
                      // Helper functions for advanced cross-reference
                      function extractKeyWords(text: string): string[] {
                        const commonWords = new Set(["的", "是", "在", "有", "和", "與", "為", "了", "the", "is", "a", "an", "and", "or", "but", "of", "to", "in", "that", "it", "this", "with", "from", "for", "on", "at", "by", "as", "be", "been", "was", "were", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "should", "could", "may", "might", "must", "can", "cannot"]);
                        const words = text.split(/[\s，。、；：！？,.\s]+/)
                          .filter(w => w.length > 1 && !commonWords.has(w.toLowerCase()))
                          .slice(0, 5); // Top 5 keywords
                        return words;
                      }
                      
                      function extractThemes(text: string): string[] {
                        const themeKeywords = [
                          "愛", "love", "信心", "faith", "救恩", "salvation", "恩典", "grace",
                          "平安", "peace", "希望", "hope", "真理", "truth", "生命", "life",
                          "神", "god", "耶穌", "jesus", "基督", "christ", "聖靈", "spirit",
                          "罪", "sin", "赦免", "forgiveness", "禱告", "prayer", "敬拜", "worship",
                          "世人", "world", "永生", "eternal life", "信", "believe", "賜給", "give"
                        ];
                        const themes: string[] = [];
                        const lowerText = text.toLowerCase();
                        themeKeywords.forEach((theme, idx) => {
                          if (idx % 2 === 0 && lowerText.includes(theme.toLowerCase())) {
                            themes.push(theme);
                          }
                        });
                        return themes.slice(0, 3);
                      }
                      
                      function extractContrastingThemes(text: string): string[] {
                        const themeMap: Record<string, string[]> = {
                          "愛": ["恨", "敵對"],
                          "love": ["hate", "enemy"],
                          "信心": ["懷疑", "不信"],
                          "faith": ["doubt", "unbelief"],
                          "救恩": ["審判", "定罪"],
                          "salvation": ["judgment", "condemnation"],
                          "恩典": ["律法", "行為"],
                          "grace": ["law", "works"],
                          "平安": ["憂慮", "恐懼"],
                          "peace": ["anxiety", "fear"],
                          "生命": ["死亡", "滅亡"],
                          "life": ["death", "destruction"],
                          "真理": ["謊言", "虛假"],
                          "truth": ["lie", "falsehood"],
                          "永生": ["滅亡", "審判"],
                          "eternal life": ["destruction", "judgment"]
                        };
                        const lowerText = text.toLowerCase();
                        const contrasting: string[] = [];
                        Object.keys(themeMap).forEach((theme) => {
                          if (lowerText.includes(theme.toLowerCase())) {
                            contrasting.push(...themeMap[theme]);
                          }
                        });
                        return contrasting.slice(0, 2);
                      }
                      
                      if (needsAdvancedCrossRef) {
                        // Advanced Cross-Reference: Three-layer analysis
                        console.log("Applying advanced_cross_reference: Three-layer analysis");
                        
                        const keyWords = extractKeyWords(verseText);
                        const themes = extractThemes(verseText);
                        const contrastingThemes = extractContrastingThemes(verseText);
                        
                        // Layer 1: Direct keyword references
                        const layer1Searches = await Promise.allSettled(
                          keyWords.slice(0, 3).map((keyword) => 
                            searchBible(keyword, "unv", 10, false)
                          )
                        );
                        
                        // Layer 2: Thematic connections
                        const layer2Searches = await Promise.allSettled(
                          themes.slice(0, 2).map((theme) => 
                            searchBible(theme, "unv", 8, false)
                          )
                        );
                        
                        // Layer 3: Contrasting/complementary verses
                        const layer3Searches = await Promise.allSettled(
                          contrastingThemes.slice(0, 2).map((theme) => 
                            searchBible(theme, "unv", 5, false)
                          )
                        );
                        
                        // Format three-layer cross-reference context
                        let crossRefContext = "\n\n[Advanced Cross-Reference Analysis - 進階交叉引用分析 (三層次)]\n";
                        
                        // Layer 1: Direct References
                        crossRefContext += "## Layer 1: 直接引用關係 (Direct References)\n";
                        layer1Searches.forEach((result, idx) => {
                          if (result.status === 'fulfilled' && result.value.record) {
                            const verses = result.value.record
                              .filter((v: any) => 
                                !(v.bid === bookId && v.chap === bibleQuery.chapter && v.sec === verseNum)
                              )
                              .slice(0, 5);
                            if (verses.length > 0) {
                              crossRefContext += `\n關鍵字: ${keyWords[idx]}\n`;
                              verses.forEach((v: any) => {
                                crossRefContext += `- ${v.chineses || v.engs} ${v.chap}:${v.sec} - ${v.bible_text.substring(0, 80)}...\n`;
                              });
                            }
                          }
                        });
                        
                        // Layer 2: Thematic Connections
                        if (themes.length > 0) {
                          crossRefContext += "\n## Layer 2: 主題相關經文 (Thematic Connections)\n";
                          layer2Searches.forEach((result, idx) => {
                            if (result.status === 'fulfilled' && result.value.record) {
                              const verses = result.value.record
                                .filter((v: any) => 
                                  !(v.bid === bookId && v.chap === bibleQuery.chapter && v.sec === verseNum)
                                )
                                .slice(0, 5);
                              if (verses.length > 0) {
                                crossRefContext += `\n主題: ${themes[idx]}\n`;
                                verses.forEach((v: any) => {
                                  crossRefContext += `- ${v.chineses || v.engs} ${v.chap}:${v.sec} - ${v.bible_text.substring(0, 80)}...\n`;
                                });
                              }
                            }
                          });
                        }
                        
                        // Layer 3: Contrasting/Complementary Verses
                        if (contrastingThemes.length > 0) {
                          crossRefContext += "\n## Layer 3: 對照經文 (Contrasting/Complementary Verses)\n";
                          layer3Searches.forEach((result, idx) => {
                            if (result.status === 'fulfilled' && result.value.record) {
                              const verses = result.value.record
                                .filter((v: any) => 
                                  !(v.bid === bookId && v.chap === bibleQuery.chapter && v.sec === verseNum)
                                )
                                .slice(0, 3);
                              if (verses.length > 0) {
                                crossRefContext += `\n對照主題: ${contrastingThemes[idx]}\n`;
                                verses.forEach((v: any) => {
                                  crossRefContext += `- ${v.chineses || v.engs} ${v.chap}:${v.sec} - ${v.bible_text.substring(0, 80)}...\n`;
                                });
                              }
                            }
                          });
                        }
                        
                        crossRefContext += "\n";
                        bibleContext += crossRefContext;
                      } else {
                        // Standard cross-reference: Simple keyword search
                        const keyWords = extractKeyWords(verseText);
                        const crossRefSearches = await Promise.allSettled(
                          keyWords.slice(0, 3).map((keyword) => 
                            searchBible(keyword, "unv", 5, false)
                          )
                        );
                        
                        let crossRefContext = "\n\n[Cross-Reference Related Verses - 交叉引用相關經文]\n";
                        crossRefSearches.forEach((result, idx) => {
                          if (result.status === 'fulfilled' && result.value.record) {
                            const verses = result.value.record
                              .filter((v: any) => 
                                !(v.bid === bookId && v.chap === bibleQuery.chapter && v.sec === verseNum)
                              )
                              .slice(0, 3);
                            if (verses.length > 0) {
                              crossRefContext += `\n關鍵字: ${keyWords[idx]}\n`;
                              verses.forEach((v: any) => {
                                crossRefContext += `- ${v.chineses || v.engs} ${v.chap}:${v.sec} - ${v.bible_text.substring(0, 80)}...\n`;
                              });
                            }
                          }
                        });
                        bibleContext += crossRefContext;
                      }
                    }
                  } catch (error) {
                    console.error("Error fetching cross-references:", error);
                  }
                }
              } catch (error) {
                console.error("Error fetching commentary or word analysis:", error);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching Bible verse:", error);
        }
      } else if (bibleQuery.type === "chapter" && bibleQuery.book && bibleQuery.chapter) {
        isBibleQuery = true;
        try {
          const bookId = parseBookName(bibleQuery.book);
          if (bookId) {
            const chapterData = await withTimeout(
              getBibleChapter(bookId, bibleQuery.chapter, "unv", false),
              BIBLE_API_TIMEOUT,
              "Chapter fetch timed out"
            );
            bibleContext += formatBibleContext(chapterData);
          }
        } catch (error) {
          console.error("Error fetching Bible chapter:", error);
        }
        } else if (bibleQuery.type === "search" && bibleQuery.keyword) {
        isBibleQuery = true;
        try {
          const keyword = bibleQuery.keyword;
          
          // Priority 1: Search Bible verses (main content) - with timeout
          const searchData = await withTimeout(
            searchBible(keyword, "unv", 15, false),
            BIBLE_API_TIMEOUT,
            "Bible search timed out"
          );
          bibleContext += formatBibleSearchContext(searchData);
          
          // Priority 2: study_topic_deep - 主題研究，全面探討聖經主題
          // Step 2: 查詢主題查經資料 (get_topic_study) - with timeout
          try {
            const { getTopicStudy } = await import("@/lib/fhl-api");
            const topicData = await withTimeout(
              getTopicStudy(keyword, "all", false, false),
              BIBLE_API_TIMEOUT,
              "Topic study timed out"
            );
            if (topicData.record && topicData.record.length > 0) {
              let topicContext = "\n\n[study_topic_deep - Step 2: Topic Study Resources - 主題查經資料 (Torrey & Naves)]\n";
              topicData.record.slice(0, 5).forEach((entry: any) => {
                const sourceName = entry.book === 0 ? "Torrey (English)" :
                                 entry.book === 1 ? "Naves (English)" :
                                 entry.book === 2 ? "Torrey (中文)" :
                                 entry.book === 3 ? "Naves (中文)" : "Unknown";
                topicContext += `[${sourceName}] ${entry.topic || ""}\n`;
                topicContext += `${entry.text || ""}\n\n`;
              });
              bibleContext += topicContext;
            }
          } catch (error) {
            console.error("Error fetching topic study:", error);
          }
          
          // Step 4: 比較兩約教導 (分別搜尋舊約和新約相關經文)
          // Use the search results from Priority 1, filter by testament
          try {
            // Filter OT verses (book IDs 1-39) from search results
            const otVerses = searchData.record?.filter((v: any) => v.bid >= 1 && v.bid <= 39).slice(0, 5) || [];
            
            // Filter NT verses (book IDs 40-66) from search results
            const ntVerses = searchData.record?.filter((v: any) => v.bid >= 40 && v.bid <= 66).slice(0, 5) || [];
            
            if (otVerses.length > 0 || ntVerses.length > 0) {
              let twoTestamentContext = "\n\n[study_topic_deep - Step 4: Two Testament Comparison - 兩約教導比較]\n";
              
              if (otVerses.length > 0) {
                twoTestamentContext += "## 舊約教導 (Old Testament Teaching):\n";
                twoTestamentContext += `Found ${otVerses.length} relevant verses:\n\n`;
                otVerses.forEach((v: any) => {
                  twoTestamentContext += `- ${v.chineses || v.engs} ${v.chap}:${v.sec} - ${v.bible_text.substring(0, 100)}...\n`;
                });
                twoTestamentContext += "\n";
              }
              
              if (ntVerses.length > 0) {
                twoTestamentContext += "## 新約教導 (New Testament Teaching):\n";
                twoTestamentContext += `Found ${ntVerses.length} relevant verses:\n\n`;
                ntVerses.forEach((v: any) => {
                  twoTestamentContext += `- ${v.chineses || v.engs} ${v.chap}:${v.sec} - ${v.bible_text.substring(0, 100)}...\n`;
                });
                twoTestamentContext += "\n";
              }
              
              twoTestamentContext += "**分析要求**: 比較兩約的異同，說明救恩歷史發展脈絡，以及主題在兩約中的發展。\n";
              bibleContext += twoTestamentContext;
            }
          } catch (error) {
            console.error("Error comparing two testaments:", error);
          }
          
          // Priority 3: Search commentary for additional insights - with timeout
          try {
            const { searchCommentary } = await import("@/lib/fhl-api");
            const commentarySearch = await withTimeout(
              searchCommentary(keyword, undefined, false),
              BIBLE_API_TIMEOUT,
              "Commentary search timed out"
            );
            if (commentarySearch.results && commentarySearch.results.length > 0) {
              let commentaryContext = "\n\n[Commentary Search Results - 註釋搜尋結果]\n";
              commentarySearch.results.slice(0, 5).forEach((result: any) => {
                commentaryContext += `[${result.commentary_name || "註釋"}] ${result.book} ${result.chapter_start}:${result.verse_start}\n`;
                commentaryContext += `${result.title || ""}\n`;
                if (result.content) {
                  commentaryContext += `${result.content.substring(0, 200)}...\n`;
                }
                commentaryContext += "\n";
              });
              bibleContext += commentaryContext;
            }
          } catch (error) {
            console.error("Error searching commentary:", error);
          }
          
          // Priority 4: Search by Strong's Number for original language study
          try {
            const { searchByStrongs } = await import("@/lib/fhl-api");
            
            // Map common keywords to Strong's Numbers for original language study
            const keywordToStrongs: Record<string, Array<{ number: string; testament: "OT" | "NT" }>> = {
              "愛": [{ number: "G26", testament: "NT" }, { number: "H157", testament: "OT" }], // agape (NT), ahab (OT)
              "love": [{ number: "G26", testament: "NT" }, { number: "H157", testament: "OT" }],
              "信心": [{ number: "G4102", testament: "NT" }], // pistis
              "faith": [{ number: "G4102", testament: "NT" }],
              "信": [{ number: "G4102", testament: "NT" }],
              "禱告": [{ number: "G4336", testament: "NT" }, { number: "H6419", testament: "OT" }], // proseuche (NT), palal (OT)
              "prayer": [{ number: "G4336", testament: "NT" }, { number: "H6419", testament: "OT" }],
              "福音": [{ number: "G2098", testament: "NT" }], // euangelion
              "gospel": [{ number: "G2098", testament: "NT" }],
              "救恩": [{ number: "G4991", testament: "NT" }, { number: "H3444", testament: "OT" }], // soteria (NT), yeshuah (OT)
              "salvation": [{ number: "G4991", testament: "NT" }, { number: "H3444", testament: "OT" }],
              "恩典": [{ number: "G5485", testament: "NT" }, { number: "H2580", testament: "OT" }], // charis (NT), chen (OT)
              "grace": [{ number: "G5485", testament: "NT" }, { number: "H2580", testament: "OT" }],
              "平安": [{ number: "G1515", testament: "NT" }, { number: "H7965", testament: "OT" }], // eirene (NT), shalom (OT)
              "peace": [{ number: "G1515", testament: "NT" }, { number: "H7965", testament: "OT" }],
              "希望": [{ number: "G1680", testament: "NT" }], // elpis
              "hope": [{ number: "G1680", testament: "NT" }],
              "真理": [{ number: "G225", testament: "NT" }, { number: "H571", testament: "OT" }], // aletheia (NT), emeth (OT)
              "truth": [{ number: "G225", testament: "NT" }, { number: "H571", testament: "OT" }],
              "生命": [{ number: "G2222", testament: "NT" }, { number: "H2416", testament: "OT" }], // zoe (NT), chay (OT)
              "life": [{ number: "G2222", testament: "NT" }, { number: "H2416", testament: "OT" }],
              "罪": [{ number: "G266", testament: "NT" }, { number: "H2403", testament: "OT" }], // hamartia (NT), chattath (OT)
              "sin": [{ number: "G266", testament: "NT" }, { number: "H2403", testament: "OT" }],
              "赦免": [{ number: "G859", testament: "NT" }, { number: "H5545", testament: "OT" }], // aphesis (NT), calach (OT)
              "forgiveness": [{ number: "G859", testament: "NT" }, { number: "H5545", testament: "OT" }],
            };
            
            // Extract keyword (remove question words and common words)
            const cleanKeyword = keyword.toLowerCase()
              .replace(/(什麼|什麼是|什麼意思|如何|怎樣|為什麼|為何|who|what|how|why|where|when|explain|tell me about|search|搜尋|查找|找|查詢|for|關於|有關|say about|說|關於)/gi, "")
              .trim();
            
            // Find matching Strong's Numbers
            const strongsToSearch = keywordToStrongs[cleanKeyword] || keywordToStrongs[keyword.toLowerCase()];
            
            if (strongsToSearch && strongsToSearch.length > 0) {
              // Search by Strong's Numbers in parallel
              const strongsSearches = await Promise.allSettled(
                strongsToSearch.slice(0, 2).map(({ number, testament }) =>
                  searchByStrongs(number, testament, 10, false)
                )
              );
              
              let strongsContext = "\n\n[Original Language Study - Strong's Number Search - 原文研究 (Strong's Number 搜尋)]\n";
              strongsSearches.forEach((result, idx) => {
                if (result.status === 'fulfilled' && result.value.record && result.value.record.length > 0) {
                  const strongsInfo = strongsToSearch[idx];
                  strongsContext += `\nStrong's ${strongsInfo.number} (${strongsInfo.testament === "NT" ? "New Testament - 新約" : "Old Testament - 舊約"}):\n`;
                  strongsContext += `Found ${result.value.record_count || result.value.record.length} occurrences\n\n`;
                  
                  // Show top 5 verses
                  result.value.record.slice(0, 5).forEach((verse: any) => {
                    strongsContext += `- ${verse.chineses || verse.engs} ${verse.chap}:${verse.sec} - ${verse.bible_text.substring(0, 100)}...\n`;
                  });
                  strongsContext += "\n";
                }
              });
              
              if (strongsContext.includes("Strong's")) {
                bibleContext += strongsContext;
              }
            }
          } catch (error) {
            console.error("Error searching by Strong's Number:", error);
          }
          
          // Priority 5: Advanced Cross-Reference Analysis (三層次交叉引用分析)
          try {
            // Helper functions for advanced cross-reference (reusable)
            function extractKeyWordsFromSearch(searchData: any): string[] {
              if (!searchData || !searchData.record || searchData.record.length === 0) {
                return [];
              }
              const commonWords = new Set(["的", "是", "在", "有", "和", "與", "為", "了", "the", "is", "a", "an", "and", "or", "but", "of", "to", "in", "that", "it", "this", "with", "from", "for", "on", "at", "by", "as", "be", "been", "was", "were", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "should", "could", "may", "might", "must", "can", "cannot"]);
              
              // Extract keywords from top search results
              const topVerses = searchData.record.slice(0, 5);
              const allWords = new Set<string>();
              
              topVerses.forEach((verse: any) => {
                const verseText = verse.bible_text || "";
                const words = verseText.split(/[\s，。、；：！？,.\s]+/)
                  .filter((w: string) => w.length > 1 && !commonWords.has(w.toLowerCase()));
                words.forEach((w: string) => allWords.add(w.toLowerCase()));
              });
              
              return Array.from(allWords).slice(0, 5);
            }
            
            function extractThemesFromKeyword(keyword: string): string[] {
              const themeKeywords = [
                "愛", "love", "信心", "faith", "救恩", "salvation", "恩典", "grace",
                "平安", "peace", "希望", "hope", "真理", "truth", "生命", "life",
                "神", "god", "耶穌", "jesus", "基督", "christ", "聖靈", "spirit",
                "罪", "sin", "赦免", "forgiveness", "禱告", "prayer", "敬拜", "worship",
                "世人", "world", "永生", "eternal life", "信", "believe", "賜給", "give"
              ];
              const themes: string[] = [];
              const lowerKeyword = keyword.toLowerCase();
              
              themeKeywords.forEach((theme, idx) => {
                if (idx % 2 === 0 && lowerKeyword.includes(theme.toLowerCase())) {
                  themes.push(theme);
                }
              });
              
              return themes.slice(0, 3);
            }
            
            function extractContrastingThemesFromKeyword(keyword: string): string[] {
              const themeMap: Record<string, string[]> = {
                "愛": ["恨", "敵對"],
                "love": ["hate", "enemy"],
                "信心": ["懷疑", "不信"],
                "faith": ["doubt", "unbelief"],
                "救恩": ["審判", "定罪"],
                "salvation": ["judgment", "condemnation"],
                "恩典": ["律法", "行為"],
                "grace": ["law", "works"],
                "平安": ["憂慮", "恐懼"],
                "peace": ["anxiety", "fear"],
                "生命": ["死亡", "滅亡"],
                "life": ["death", "destruction"],
                "真理": ["謊言", "虛假"],
                "truth": ["lie", "falsehood"],
                "永生": ["滅亡", "審判"],
                "eternal life": ["destruction", "judgment"]
              };
              const lowerKeyword = keyword.toLowerCase();
              const contrasting: string[] = [];
              
              Object.keys(themeMap).forEach((theme) => {
                if (lowerKeyword.includes(theme.toLowerCase())) {
                  contrasting.push(...themeMap[theme]);
                }
              });
              
              return contrasting.slice(0, 2);
            }
            
            // Extract keywords from search results
            const keyWords = extractKeyWordsFromSearch(searchData);
            const themes = extractThemesFromKeyword(keyword);
            const contrastingThemes = extractContrastingThemesFromKeyword(keyword);
            
            // Apply advanced cross-reference analysis
            if (keyWords.length > 0 || themes.length > 0) {
              console.log("Applying advanced_cross_reference for search query");
              
              // Layer 1: Direct keyword references (from search results)
              const layer1Searches = keyWords.length > 0 
                ? await Promise.allSettled(
                    keyWords.slice(0, 3).map((kw) => 
                      searchBible(kw, "unv", 8, false)
                    )
                  )
                : [];
              
              // Layer 2: Thematic connections
              const layer2Searches = themes.length > 0
                ? await Promise.allSettled(
                    themes.slice(0, 2).map((theme) => 
                      searchBible(theme, "unv", 8, false)
                    )
                  )
                : [];
              
              // Layer 3: Contrasting/complementary verses
              const layer3Searches = contrastingThemes.length > 0
                ? await Promise.allSettled(
                    contrastingThemes.slice(0, 2).map((theme) => 
                      searchBible(theme, "unv", 5, false)
                    )
                  )
                : [];
              
              // Format three-layer cross-reference context
              let crossRefContext = "\n\n[Advanced Cross-Reference Analysis - 進階交叉引用分析 (三層次)]\n";
              
              // Layer 1: Direct References
              if (keyWords.length > 0) {
                crossRefContext += "## Layer 1: 直接引用關係 (Direct References)\n";
                layer1Searches.forEach((result, idx) => {
                  if (result.status === 'fulfilled' && result.value.record) {
                    const verses = result.value.record.slice(0, 5);
                    if (verses.length > 0) {
                      crossRefContext += `\n關鍵字: ${keyWords[idx]}\n`;
                      verses.forEach((v: any) => {
                        crossRefContext += `- ${v.chineses || v.engs} ${v.chap}:${v.sec} - ${v.bible_text.substring(0, 80)}...\n`;
                      });
                    }
                  }
                });
              }
              
              // Layer 2: Thematic Connections
              if (themes.length > 0) {
                crossRefContext += "\n## Layer 2: 主題相關經文 (Thematic Connections)\n";
                layer2Searches.forEach((result, idx) => {
                  if (result.status === 'fulfilled' && result.value.record) {
                    const verses = result.value.record.slice(0, 5);
                    if (verses.length > 0) {
                      crossRefContext += `\n主題: ${themes[idx]}\n`;
                      verses.forEach((v: any) => {
                        crossRefContext += `- ${v.chineses || v.engs} ${v.chap}:${v.sec} - ${v.bible_text.substring(0, 80)}...\n`;
                      });
                    }
                  }
                });
              }
              
              // Layer 3: Contrasting/Complementary Verses
              if (contrastingThemes.length > 0) {
                crossRefContext += "\n## Layer 3: 對照經文 (Contrasting/Complementary Verses)\n";
                layer3Searches.forEach((result, idx) => {
                  if (result.status === 'fulfilled' && result.value.record) {
                    const verses = result.value.record.slice(0, 3);
                    if (verses.length > 0) {
                      crossRefContext += `\n對照主題: ${contrastingThemes[idx]}\n`;
                      verses.forEach((v: any) => {
                        crossRefContext += `- ${v.chineses || v.engs} ${v.chap}:${v.sec} - ${v.bible_text.substring(0, 80)}...\n`;
                      });
                    }
                  }
                });
              }
              
              crossRefContext += "\n";
              bibleContext += crossRefContext;
            }
          } catch (error) {
            console.error("Error in advanced cross-reference analysis:", error);
          }
        } catch (error) {
          console.error("Error searching Bible:", error);
          // Even if API fails, mark as Bible query to use enhanced prompt
          isBibleQuery = true;
        }
        }
      }
    }
    
    // Check if advanced cross-reference is needed
    const userMessage = lastMessage?.content || "";
    const needsAdvancedCrossRef = /(交叉引用|相關經文|經文網絡|引用關係|經文關係|找出相關|找連結|連結經文|cross reference|related verses|verse network|reference relation|verse relation|connect|link verse)/i.test(userMessage);
    
    // Detect query type for strategy selection
    const detectedBibleQuery = lastMessage && lastMessage.role === "user" 
      ? detectBibleQuery(lastMessage.content)
      : { type: null };
    const isSearchQuery = detectedBibleQuery.type === "search";
    const isVerseQuery = detectedBibleQuery.type === "verse" || detectedBibleQuery.type === "chapter";
    
    // Generate system prompt for Bible queries - MUST include all required elements
    const systemMessage = (isBibleQuery || bibleContext)
      ? {
          role: "system" as const,
          content: `You are an expert Bible study assistant. When answering Bible-related questions, you MUST prioritize using the FHL Bible API data provided in the context and include ALL of the following elements in your response:
${needsAdvancedCrossRef ? `
## Advanced Cross-Reference Analysis (advanced_cross_reference)

You are providing a THREE-LAYER cross-reference analysis:

### Layer 1: Direct References (直接引用關係)
- Use the direct keyword references provided in the context
- Show verses that directly quote or reference similar keywords
- Explain the direct connection between verses

### Layer 2: Thematic Connections (主題相關經文)
- Use the thematic connections provided in the context
- Show verses that share the same theological themes
- Explain how themes develop across Scripture

### Layer 3: Contrasting/Complementary Verses (對照經文)
- Use the contrasting/complementary verses provided in the context
- Show verses that contrast or complement the main verse
- Explain the relationship and theological significance

**Structure your response to clearly show all three layers with clear headings.**
` : ""}
${isVerseQuery && detectedBibleQuery.book && detectedBibleQuery.chapter ? `
## Study Strategy: study_verse_deep - 深入研讀經文

# 深入研讀經文 - ${detectedBibleQuery.book} ${detectedBibleQuery.chapter}${detectedBibleQuery.verse ? `:${detectedBibleQuery.verse}` : ""}

## 步驟 1: 獲取經文內容
**執行**: get_bible_verse 查詢 ${detectedBibleQuery.book} ${detectedBibleQuery.chapter}${detectedBibleQuery.verse ? `:${detectedBibleQuery.verse}` : ""} (unv)
**輸出**: 經文內容及 Strong's Number 版本
- Use the Bible verse data provided in the context
- Show verse content with Strong's Numbers

## 步驟 2: 分析原文字彙
**執行**: get_word_analysis 取得希臘文/希伯來文分析
**輸出**: 每個重要字詞的原文、詞性、字型變化
- Use the word analysis data provided in the context
- Show original language analysis for each important word

## 步驟 3: 研究關鍵字詞
**執行**: lookup_strongs 查詢關鍵字的 Strong's 字典
**輸出**: 原文意義、用法、神學含義、同源字
- Use the Strong's Dictionary lookup results provided in the context
- Show original meaning, usage, theological significance, and related words

## 步驟 4: 查詢註釋解經
**執行**: get_commentary 取得該節經文註釋
**輸出**: 綜合不同註釋書的觀點和應用建議
- Use the commentary data provided in the context
- Show insights from different commentary sources

## 步驟 5: 連結相關經文
**執行**: search_bible 搜尋相關主題或關鍵字
**輸出**: 3-5 處相關經文供交叉參考
- Use the cross-reference verses provided in the context
- Show 3-5 related verses for cross-reference

## 步驟 6: 綜合研讀總結
**執行**: 整合所有資訊
**輸出**: 核心信息、神學意義、實際應用、思考問題
- Integrate all information from Steps 1-5
- Provide core message, theological significance, practical application, and reflection questions

💡 工具: get_bible_verse, get_word_analysis, lookup_strongs, get_commentary

## 必需輸出元素 (Required Output Elements):

### 1. **經文解釋 (Verse Explanation)** - REQUIRED
   - **必須明確標註出處**，例如："根據CBOL註釋..."、"根據[註釋書名稱]..."、"According to [Commentary Name]..."
   - **優先使用**上下文中的註釋數據（commentary data）
   - 如果上下文沒有註釋，可以使用你的知識庫搜索相關註釋
   - **交叉確認**: 將知識庫的註釋與 FHL API 的經文內容進行對比，確保一致性
   - 解釋經文的含義、上下文、神學意義
   - Format: "【註釋出處】[經文解釋內容]"

### 2. **歷史背景 (Historical Background)** - REQUIRED
   - **優先使用**上下文中的歷史背景信息（如果 FHL API 提供）
   - 如果上下文沒有歷史背景，使用你的知識庫搜索相關信息
   - **交叉確認**: 確保歷史背景信息與 FHL API 的經文和註釋數據一致
   - Explain the historical and cultural context of when this was written
   - Describe the author, intended audience, and time period
   - Include relevant historical events, customs, or social context
   - Explain how this context affects the meaning
   - 標註來源：明確說明歷史背景信息的來源（FHL API 或知識庫）

### 3. **交叉引用 (Cross References)** - REQUIRED
   - **優先使用**上下文中的交叉引用經文（cross-reference verses）
   - **如果上下文包含 "[Advanced Cross-Reference Analysis - 進階交叉引用分析 (三層次)]"**:
     - **必須使用**三層次交叉引用分析數據
     - **Layer 1**: 使用直接引用關係的經文（Direct References）
     - **Layer 2**: 使用主題相關經文（Thematic Connections）
     - **Layer 3**: 使用對照經文（Contrasting/Complementary Verses）
     - 按照三層次結構組織交叉引用內容
   - 如果上下文中的交叉引用不足，可以使用你的知識庫搜索相關經文
   - **交叉確認**: 必須與 FHL API 返回的經文進行對比，確保引用經文的準確性
   - List 5-10 related verses that reference similar themes, concepts, or words
   - Show how this verse connects to other parts of Scripture
   - Include both Old and New Testament connections when relevant
   - Format as: "相關經文：約翰一書 4:9-10, 羅馬書 5:8, 以弗所書 2:4-5..."
   - Explain briefly how each reference relates to the current verse
   - 標註來源：明確說明交叉引用經文的來源（FHL API 或知識庫）

### 4. **反思提示 (Reflection Questions)** - REQUIRED
   - Provide 2-3 thoughtful reflection questions
   - Help readers apply the verse to their lives
   - Encourage deeper spiritual growth and practical application
   - Questions should be specific and actionable
   - Format: "反思問題：1. [問題1] 2. [問題2] 3. [問題3]"

**Structure your response following these 6 steps with clear headings, and ensure ALL 4 required output elements are included.**
` : ""}
${isSearchQuery ? `
## Study Strategy: study_topic_deep - 主題研究，全面探討聖經主題

# 主題研究 - 「${detectedBibleQuery.keyword || "主題"}」

## 步驟 1: 搜尋相關經文
**執行**: search_bible 在 unv 中搜尋「${detectedBibleQuery.keyword || "主題"}」
**輸出**: 總數統計 + 最相關的經文
- Use the Bible search results provided in the context
- Show total count and most relevant verses

## 步驟 2: 查詢主題查經資料
**執行**: get_topic_study 取得「${detectedBibleQuery.keyword || "主題"}」的主題查經
**輸出**: Torrey 和 Naves 相關條目，聖經神學架構
- Use the topic study resources (Torrey & Naves) provided in the context
- Show biblical theological framework

## 步驟 3: 搜尋註釋討論
**執行**: search_commentary 在註釋書中搜尋「${detectedBibleQuery.keyword || "主題"}」
**輸出**: 註釋家見解摘要，不同神學傳統觀點
- Use the commentary search results provided in the context
- Show insights from different theological traditions

## 步驟 4: 比較兩約教導
**執行**: 分別搜尋舊約和新約相關經文
**輸出**: 兩約異同，救恩歷史發展脈絡
- Use the two testament comparison data provided in the context
- Compare Old Testament vs New Testament teachings
- Show similarities and differences
- Explain salvation history development

## 步驟 5: 研究原文洞察
**執行**: lookup_strongs 查詢關鍵希伯來文/希臘文字詞
**輸出**: 原文字義如何豐富主題理解
- Use the Strong's Number search results provided in the context
- Show how original language meanings enrich topic understanding

## 步驟 6: 綜合分析與應用
**執行**: 整合所有資料
**輸出**: 整體教導總結、3-5個核心真理、生活應用
- Integrate all data from Steps 1-5
- Provide overall teaching summary
- List 3-5 core truths
- Include practical life application

💡 工具: search_bible, get_topic_study, search_commentary, lookup_strongs

**Structure your response following these 6 steps with clear headings.**
` : ""}

## 核心要求 (Core Requirements):

**優先使用 FHL Bible API 提供的數據來回答問題。只有在 API 數據不足時，才補充使用你的知識庫。**

### 1. **原文解釋 (Original Language Explanation)** - REQUIRED
   - **必須使用**上下文中的原文分析數據（word analysis）
   - **優先使用**上下文中的 Strong's Number 搜尋結果（search_by_strongs）
   - Explain key words from the original Hebrew/Greek text
   - Include Strong's Numbers if provided in the context
   - Explain the grammatical structure and parsing
   - Show how the original meaning enhances understanding
   - **使用 Strong's Number 搜尋結果**:
     - 上下文中的 "[Original Language Study - Strong's Number Search]" 提供了以 Strong's Number 搜尋的經文
     - 這些經文展示了該原文字在聖經中的使用情況
     - 分析該原文字在不同經文中的語義範圍和用法
     - 說明該原文字如何增強對主題的理解
   - If word analysis data is incomplete in context:
     - 可以使用你的知識庫搜索相關的 Strong's Number 或原文字義
     - **交叉確認**: 將知識庫的原文解釋與 FHL API 的經文內容和 Strong's Number 搜尋結果進行對比
     - 確保原文解釋與經文內容一致
     - 明確標註："根據知識庫補充..." 或 "與 FHL API 數據交叉確認後..."
   - Format: "關鍵字：[原文字] (Strong's G/H[數字]) - [解釋] - 在聖經中出現 [X] 次，例如：..."

### 2. **經文註釋 (Commentary)** - REQUIRED
   - **必須使用**上下文中的註釋數據（commentary data）
   - **必須明確標註出處**，例如："根據CBOL註釋..."、"根據[註釋書名稱]..."、"According to [Commentary Name]..."
   - Include multiple perspectives if multiple commentaries are available
   - If no commentary is provided in context:
     - 可以使用你的知識庫搜索相關註釋
     - **交叉確認**: 將知識庫的註釋與 FHL API 的經文內容進行對比，確保一致性
     - 如果發現差異，優先採用 FHL API 的經文內容
     - 明確標註："根據知識庫補充..." 或 "與 FHL API 數據交叉確認後..."
   - Format: "【註釋出處】[註釋內容]"

### 3. **經文交叉引用 (Cross References)** - REQUIRED
   - **優先使用**上下文中的交叉引用經文（cross-reference verses）
   - **如果上下文包含 "[Advanced Cross-Reference Analysis - 進階交叉引用分析 (三層次)]"**:
     - **必須使用**三層次交叉引用分析數據
     - **Layer 1**: 使用直接引用關係的經文（Direct References）
     - **Layer 2**: 使用主題相關經文（Thematic Connections）
     - **Layer 3**: 使用對照經文（Contrasting/Complementary Verses）
     - 按照三層次結構組織交叉引用內容
     - 說明每一層次的經文如何與主題相關
   - 如果上下文中的交叉引用不足，可以使用你的知識庫搜索相關經文
   - **交叉確認**: 將知識庫搜索到的經文與 FHL API 返回的經文進行對比
   - List 5-10 related verses that reference similar themes, concepts, or words
   - Show how this verse connects to other parts of Scripture
   - Include both Old and New Testament connections when relevant
   - Format as: "相關經文：約翰一書 4:9-10, 羅馬書 5:8, 以弗所書 2:4-5..."
   - Explain briefly how each reference relates to the current verse or topic
   - 標註來源：哪些經文來自 FHL API，哪些來自知識庫補充

### 4. **歷史背景 (Historical Background)** - REQUIRED
   - **優先使用**上下文中的歷史背景信息（如果 FHL API 提供）
   - 如果上下文沒有歷史背景，使用你的知識庫搜索相關信息
   - **交叉確認**: 確保歷史背景信息與 FHL API 的經文和註釋數據一致
   - Explain the historical and cultural context of when this was written
   - Describe the author, intended audience, and time period
   - Include relevant historical events, customs, or social context
   - Explain how this context affects the meaning
   - 標註來源：明確說明歷史背景信息的來源（FHL API 或知識庫）

### 5. **反思提示 (Reflection Questions)** - REQUIRED
   - Provide 2-3 thoughtful reflection questions
   - Help readers apply the verse to their lives
   - Encourage deeper spiritual growth and practical application
   - Questions should be specific and actionable

## 數據使用優先級 (Data Priority):

1. **第一優先**: 使用 FHL Bible API 提供的數據（經文、註釋、原文分析、交叉引用）
   - 優先使用 API 返回的經文內容
   - 優先使用 API 返回的註釋（必須註明出處）
   - 優先使用 API 返回的原文分析數據

2. **第二優先**: 如果 API 數據不足，可以使用你的知識庫來搜索和補充
   - 當 API 數據不完整時，使用你的知識庫搜索相關信息
   - **重要**: 必須與 FHL Bible API 的內容進行交叉確認
   - 比較不同來源的數據，確保一致性
   - 如果發現差異，優先採用 FHL API 的數據

3. **交叉確認原則**:
   - 當使用知識庫數據時，必須與 FHL API 數據對比
   - 如果知識庫數據與 FHL API 數據一致 → 可以補充使用
   - 如果知識庫數據與 FHL API 數據不一致 → 優先採用 FHL API 數據，並說明差異
   - 如果 FHL API 沒有相關數據 → 可以使用知識庫，但需明確標註來源

4. **必須標註**: 明確區分哪些內容來自 FHL API，哪些來自知識庫
   - FHL API 數據：標註為 "根據 FHL Bible API..."、"根據 FHL 註釋..."
   - 知識庫數據：標註為 "根據知識庫..."、"補充說明..."
   - 交叉確認：標註為 "與 FHL API 數據交叉確認後..."

## 格式要求 (Formatting Guidelines):
- Use clear markdown headings (##, ###)
- Use bullet points for lists
- Use blockquotes for verse citations
- Always cite sources clearly (commentary sources, verse references)
- Be thorough but concise (aim for comprehensive but readable)
- Write in Traditional Chinese unless the user requests otherwise

${bibleContext || "[注意：未獲取到 FHL Bible API 數據，請基於你的知識庫回答，但仍需包含所有必需元素]"}`
        }
      : null;
    
    // Prepend system message if Bible context is available, otherwise use original messages
    const enhancedMessages = systemMessage 
      ? [systemMessage, ...messages]
      : messages;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // supermind-agent-v1 doesn't support streaming
    const useStreaming = selectedModel !== "supermind-agent-v1";

    console.log("Making API request with model:", selectedModel);
    console.log("Base URL:", "https://space.ai-builders.com/backend/v1");
    console.log("Messages count:", messages.length);
    console.log("Streaming:", useStreaming);
    console.log("Bible context length:", bibleContext.length);

    // Add timeout to AI API call
    const completion = await withTimeout(
      openai.chat.completions.create({
        model: selectedModel,
        messages: enhancedMessages,
        stream: useStreaming,
        temperature: 0.7,
      }),
      API_TIMEOUT,
      "AI API request timed out"
    );

    const encoder = new TextEncoder();

    if (useStreaming) {
      // Streaming response for grok-4-fast
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of completion as any) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                const data = `data: ${JSON.stringify({ content })}\n\n`;
                controller.enqueue(encoder.encode(data));
              }
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (error: any) {
            console.error("Streaming error:", error);
            const errorData = `data: ${JSON.stringify({ 
              error: error.message || "Streaming error occurred" 
            })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } else {
      // Non-streaming response for supermind-agent-v1
      const content = (completion as any).choices[0]?.message?.content || "";
      const readableStream = new ReadableStream({
        start(controller) {
          if (content) {
            // Send content in chunks to simulate streaming
            const chunkSize = 10;
            let index = 0;
            const sendChunk = () => {
              if (index < content.length) {
                const chunk = content.slice(index, index + chunkSize);
                const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
                controller.enqueue(encoder.encode(data));
                index += chunkSize;
                setTimeout(sendChunk, 10);
              } else {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
              }
            };
            sendChunk();
          } else {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }
  } catch (error: any) {
    console.error("Chat API error:", error);
    const errorMessage = error.message || "Failed to process chat request";
    const isTimeout = errorMessage.includes("timed out");
    
    console.error("Error details:", {
      message: errorMessage,
      status: error.status,
      type: error.constructor.name,
      isTimeout,
    });
    
    // Return 504 for timeout errors, 500 for other errors
    const statusCode = isTimeout ? 504 : (error.status || 500);
    
    return new Response(
      JSON.stringify({
        error: isTimeout 
          ? "Request timed out. Please try again with a simpler query or disable Bible mode."
          : errorMessage,
        details: error.status ? `Status: ${error.status}` : undefined,
      }),
      { status: statusCode, headers: { "Content-Type": "application/json" } }
    );
  }
}
