import { NextRequest } from "next/server";
import {
  getBibleVerse,
  getBibleChapter,
  searchBible,
  getBibleVersions,
  getWordAnalysis,
  getCommentary,
  listCommentaries,
  parseBookName,
} from "@/lib/fhl-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Bible API Route
 * Handles Bible-related queries and returns formatted results
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get("action") || "verse";

    switch (action) {
      case "verse": {
        const book = searchParams.get("book");
        const chapter = searchParams.get("chapter");
        const verse = searchParams.get("verse");
        const version = searchParams.get("version") || "unv";
        const includeStrong = searchParams.get("strong") === "1";
        const simplified = searchParams.get("simplified") === "1";

        if (!book || !chapter) {
          return new Response(
            JSON.stringify({ error: "Book and chapter are required" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const bookId = parseBookName(book) || parseInt(book);
        if (!bookId) {
          return new Response(
            JSON.stringify({ error: "Invalid book name" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const result = await getBibleVerse(
          bookId,
          parseInt(chapter),
          verse || undefined,
          version,
          includeStrong,
          simplified
        );

        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      }

      case "chapter": {
        const book = searchParams.get("book");
        const chapter = searchParams.get("chapter");
        const version = searchParams.get("version") || "unv";
        const simplified = searchParams.get("simplified") === "1";

        if (!book || !chapter) {
          return new Response(
            JSON.stringify({ error: "Book and chapter are required" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const bookId = parseBookName(book) || parseInt(book);
        if (!bookId) {
          return new Response(
            JSON.stringify({ error: "Invalid book name" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const result = await getBibleChapter(
          bookId,
          parseInt(chapter),
          version,
          simplified
        );

        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      }

      case "search": {
        const keyword = searchParams.get("keyword");
        const version = searchParams.get("version") || "unv";
        const limit = parseInt(searchParams.get("limit") || "50");
        const simplified = searchParams.get("simplified") === "1";

        if (!keyword) {
          return new Response(
            JSON.stringify({ error: "Keyword is required" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const result = await searchBible(keyword, version, limit, simplified);
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      }

      case "versions": {
        const result = await getBibleVersions();
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      }

      case "word-analysis": {
        const book = searchParams.get("book");
        const chapter = searchParams.get("chapter");
        const verse = searchParams.get("verse");
        const simplified = searchParams.get("simplified") === "1";

        if (!book || !chapter || !verse) {
          return new Response(
            JSON.stringify({ error: "Book, chapter, and verse are required" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const bookId = parseBookName(book) || parseInt(book);
        if (!bookId) {
          return new Response(
            JSON.stringify({ error: "Invalid book name" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const result = await getWordAnalysis(
          bookId,
          parseInt(chapter),
          parseInt(verse),
          simplified
        );

        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      }

      case "commentary": {
        const book = searchParams.get("book");
        const chapter = searchParams.get("chapter");
        const verse = searchParams.get("verse");
        const commentaryId = searchParams.get("commentary_id");
        const simplified = searchParams.get("simplified") === "1";

        if (!book || !chapter || !verse) {
          return new Response(
            JSON.stringify({ error: "Book, chapter, and verse are required" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const bookId = parseBookName(book) || parseInt(book);
        if (!bookId) {
          return new Response(
            JSON.stringify({ error: "Invalid book name" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const result = await getCommentary(
          bookId,
          parseInt(chapter),
          parseInt(verse),
          commentaryId ? parseInt(commentaryId) : undefined,
          simplified
        );

        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      }

      case "commentaries": {
        const simplified = searchParams.get("simplified") === "1";
        const result = await listCommentaries(simplified);
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }
  } catch (error: any) {
    console.error("Bible API error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to process Bible query",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
