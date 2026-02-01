/**
 * FHL Bible API Client
 * 
 * Direct integration with FHL Bible API (https://bible.fhl.net/json/)
 * Based on API documentation: https://bible.fhl.net/api/
 */

const FHL_API_BASE = "https://bible.fhl.net/json/";
const FHL_API_TIMEOUT = 8000; // 8 seconds timeout for FHL API calls

/**
 * Fetch with timeout wrapper
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = FHL_API_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`FHL API timeout after ${timeout}ms`);
    }
    throw error;
  }
}

export interface BibleVerse {
  bid: number;
  engs: string;
  chineses: string;
  chap: number;
  sec: number;
  bible_text: string;
}

export interface BibleResponse {
  status: string;
  record_count: number;
  proc?: number;
  version?: string;
  v_name?: string;
  prev?: {
    chineses: string;
    engs: string;
    chap: number;
    sec: number;
  };
  next?: {
    chineses: string;
    engs: string;
    chap: number;
    sec: number;
  };
  record: BibleVerse[];
}

export interface BookInfo {
  book: string;
  cname: string;
  proc: number;
  strong: number;
  ntonly: number;
  otonly: number;
}

/**
 * Get Bible verse(s) by book, chapter, and verse
 */
export async function getBibleVerse(
  book: string | number,
  chapter: number,
  verse?: string,
  version: string = "unv",
  includeStrong: boolean = false,
  simplified: boolean = false
): Promise<BibleResponse> {
  const params = new URLSearchParams({
    bid: typeof book === "number" ? book.toString() : book,
    chap: chapter.toString(),
    version,
    strong: includeStrong ? "1" : "0",
    gb: simplified ? "1" : "0",
  });

  if (verse) {
    params.append("sec", verse);
  }

  const response = await fetchWithTimeout(`${FHL_API_BASE}qb.php?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`FHL API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get entire chapter
 */
export async function getBibleChapter(
  book: string | number,
  chapter: number,
  version: string = "unv",
  simplified: boolean = false
): Promise<BibleResponse> {
  return getBibleVerse(book, chapter, undefined, version, false, simplified);
}

/**
 * Search Bible by keyword
 */
export async function searchBible(
  keyword: string,
  version: string = "unv",
  limit: number = 50,
  simplified: boolean = false
): Promise<any> {
  const params = new URLSearchParams({
    q: keyword,
    version,
    limit: limit.toString(),
    gb: simplified ? "1" : "0",
  });

  const response = await fetchWithTimeout(`${FHL_API_BASE}search.php?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`FHL API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get list of Bible versions
 */
export async function getBibleVersions(): Promise<{ record_count: number; record: BookInfo[] }> {
  const response = await fetchWithTimeout(`${FHL_API_BASE}ab.php`);
  if (!response.ok) {
    throw new Error(`FHL API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get book list
 */
export async function getBookList(): Promise<string> {
  const response = await fetchWithTimeout(`${FHL_API_BASE}listall.html`);
  if (!response.ok) {
    throw new Error(`FHL API error: ${response.statusText}`);
  }

  return response.text();
}

/**
 * Get word analysis for a verse
 */
export async function getWordAnalysis(
  book: string | number,
  chapter: number,
  verse: number,
  simplified: boolean = false
): Promise<any> {
  const params = new URLSearchParams({
    bid: typeof book === "number" ? book.toString() : book,
    chap: chapter.toString(),
    sec: verse.toString(),
    gb: simplified ? "1" : "0",
  });

  const response = await fetchWithTimeout(`${FHL_API_BASE}qp.php?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`FHL API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get commentary for a verse
 */
export async function getCommentary(
  book: string | number,
  chapter: number,
  verse: number,
  commentaryId?: number,
  simplified: boolean = false
): Promise<any> {
  const params = new URLSearchParams({
    bid: typeof book === "number" ? book.toString() : book,
    chap: chapter.toString(),
    sec: verse.toString(),
    gb: simplified ? "1" : "0",
  });

  if (commentaryId) {
    params.append("book", commentaryId.toString());
  }

  const response = await fetchWithTimeout(`${FHL_API_BASE}sc.php?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`FHL API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * List all available commentaries
 */
export async function listCommentaries(simplified: boolean = false): Promise<any> {
  const params = new URLSearchParams({
    gb: simplified ? "1" : "0",
  });

  const response = await fetchWithTimeout(`${FHL_API_BASE}sc.php?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`FHL API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Lookup Strong's Dictionary
 * Supports formats: "G3056", "H430", or (3056, "NT")
 * API: sd.php
 */
export async function lookupStrongs(
  number: string | number,
  testament?: "OT" | "NT",
  simplified: boolean = false
): Promise<any> {
  let strongsNumber: number;
  let strongsTestament: string;

  // Parse Strong's number format
  const numberStr = typeof number === "string" ? number.toUpperCase().trim() : number.toString();
  
  if (numberStr.startsWith("G")) {
    // Greek (New Testament)
    strongsNumber = parseInt(numberStr.substring(1).replace(/^0+/, "")) || parseInt(numberStr.substring(1));
    strongsTestament = "nt";
  } else if (numberStr.startsWith("H")) {
    // Hebrew (Old Testament)
    strongsNumber = parseInt(numberStr.substring(1).replace(/^0+/, "")) || parseInt(numberStr.substring(1));
    strongsTestament = "ot";
  } else {
    // Plain number - requires testament parameter
    if (!testament) {
      throw new Error("Testament parameter required when using plain number format");
    }
    strongsNumber = typeof number === "number" ? number : parseInt(numberStr.replace(/^0+/, "") || numberStr);
    strongsTestament = testament.toLowerCase();
  }

  // FHL API uses: N=0 for NT, N=1 for OT, k=number
  const params = new URLSearchParams({
    N: strongsTestament === "nt" ? "0" : "1",
    k: strongsNumber.toString(),
    gb: simplified ? "1" : "0",
  });

  const response = await fetchWithTimeout(`${FHL_API_BASE}sd.php?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`FHL API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Search Bible by Strong's Number
 * Uses search_bible with search_type="greek_number" or "hebrew_number"
 */
export async function searchByStrongs(
  number: string | number,
  testament?: "OT" | "NT",
  limit: number = 50,
  simplified: boolean = false
): Promise<any> {
  let strongsNumber: number;
  let strongsTestament: string;

  // Parse Strong's number format
  const numberStr = typeof number === "string" ? number.toUpperCase().trim() : number.toString();
  
  if (numberStr.startsWith("G")) {
    strongsNumber = parseInt(numberStr.substring(1).replace(/^0+/, "")) || parseInt(numberStr.substring(1));
    strongsTestament = "nt";
  } else if (numberStr.startsWith("H")) {
    strongsNumber = parseInt(numberStr.substring(1).replace(/^0+/, "")) || parseInt(numberStr.substring(1));
    strongsTestament = "ot";
  } else {
    if (!testament) {
      throw new Error("Testament parameter required when using plain number format");
    }
    strongsNumber = typeof number === "number" ? number : parseInt(numberStr.replace(/^0+/, "") || numberStr);
    strongsTestament = testament.toLowerCase();
  }

  // Use search_bible with search_type parameter
  const searchType = strongsTestament === "nt" ? "greek_number" : "hebrew_number";
  const scope = strongsTestament === "nt" ? "nt" : "ot";

  const params = new URLSearchParams({
    q: strongsNumber.toString(),
    search_type: searchType,
    scope,
    limit: limit.toString(),
    gb: simplified ? "1" : "0",
  });

  const response = await fetchWithTimeout(`${FHL_API_BASE}search.php?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`FHL API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get topic study (Torrey, Naves)
 */
export async function getTopicStudy(
  keyword: string,
  source: "all" | "torrey_en" | "naves_en" | "torrey_zh" | "naves_zh" = "all",
  simplified: boolean = false,
  countOnly: boolean = false
): Promise<any> {
  const sourceMap: Record<string, string> = {
    all: "4",
    torrey_en: "0",
    naves_en: "1",
    torrey_zh: "2",
    naves_zh: "3",
  };

  const params = new URLSearchParams({
    keyword,
    N: sourceMap[source],
    count_only: countOnly ? "1" : "0",
    gb: simplified ? "1" : "0",
  });

  const response = await fetchWithTimeout(`${FHL_API_BASE}st.php?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`FHL API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Search commentary by keyword
 */
export async function searchCommentary(
  keyword: string,
  commentaryId?: number,
  simplified: boolean = false
): Promise<any> {
  const params = new URLSearchParams({
    keyword,
    gb: simplified ? "1" : "0",
  });

  if (commentaryId) {
    params.append("book", commentaryId.toString());
  }

  const response = await fetchWithTimeout(`${FHL_API_BASE}ssc.php?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`FHL API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Parse book name to book ID
 * Supports both Chinese and English book names
 */
export function parseBookName(bookName: string): number | null {
  // Common book mappings (simplified version)
  // Full mapping would be in a separate file
  const bookMap: Record<string, number> = {
    // Old Testament
    "創世記": 1, "創": 1, "genesis": 1, "gen": 1,
    "出埃及記": 2, "出": 2, "exodus": 2, "exo": 2,
    "利未記": 3, "利": 3, "leviticus": 3, "lev": 3,
    "民數記": 4, "民": 4, "numbers": 4, "num": 4,
    "申命記": 5, "申": 5, "deuteronomy": 5, "deu": 5,
    // New Testament
    "馬太福音": 40, "太": 40, "matthew": 40, "mat": 40,
    "馬可福音": 41, "可": 41, "mark": 41, "mar": 41,
    "路加福音": 42, "路": 42, "luke": 42, "luk": 42,
    "約翰福音": 43, "約": 43, "john": 43, "joh": 43,
    "使徒行傳": 44, "徒": 44, "acts": 44, "act": 44,
    "羅馬書": 45, "羅": 45, "romans": 45, "rom": 45,
    // Add more mappings as needed
  };

  const normalized = bookName.toLowerCase().trim();
  return bookMap[normalized] || bookMap[bookName] || null;
}
