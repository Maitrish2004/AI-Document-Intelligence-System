const fs = require("fs");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
const { findBestMatch } = require("./similarityMatcher");
async function findAnswerPage(pdfPath, answer) {
  try {
    const data = new Uint8Array(fs.readFileSync(pdfPath));

    const pdf = await pdfjsLib.getDocument({
      data
    }).promise;

    const normalizedAnswer = answer
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const stopWords = new Set([
      "the", "is", "are", "was", "were",
      "and", "or", "of", "to",
      "in", "on", "for", "with",
      "this", "that", "these", "those",
      "has", "have", "had",
      "can", "will", "shall",
      "from", "into"
    ]);

    const answerWords = normalizedAnswer
      .split(" ")
      .filter(word =>
        word.length > 2 &&
        !stopWords.has(word)
      );

    if (answerWords.length === 0) {
      return {
        found: false,
        page: null,
        pageText: "",
        items: [],
        box: null
      };
    }

    let bestMatch = null;

    // --------------------------------------------------
    // CHECK EVERY PAGE
    // --------------------------------------------------

    for (
      let pageNumber = 1;
      pageNumber <= pdf.numPages;
      pageNumber++
    ) {

      const page = await pdf.getPage(pageNumber);

      const textContent = await page.getTextContent();

      const viewport = page.getViewport({
        scale: 1
      });

      const items = textContent.items;

      // --------------------------------------------------
      // NORMALIZE PDF ITEMS
      // --------------------------------------------------

      const normalizedItems = items.map((item, index) => ({
        ...item,

        index,

        clean: (item.str || "")
          .toLowerCase()
          .replace(/[^\w\s]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      }));

      // --------------------------------------------------
      // PAGE TEXT
      // --------------------------------------------------

      const pageText = normalizedItems
        .map(item => item.clean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      let score = 0;

      // --------------------------------------------------
      // PAGE SCORE
      // --------------------------------------------------

      if (pageText.includes(normalizedAnswer)) {
        score += 5000;
      }

      // Phrase matching
      for (let i = 0; i < answerWords.length - 1; i++) {

        const phrase =
          answerWords[i] +
          " " +
          answerWords[i + 1];

        if (pageText.includes(phrase)) {
          score += 10;
        }
      }

      // Single word matching
      answerWords.forEach(word => {

        const regex =
          new RegExp(`\\b${word}\\b`, "g");

        const matches =
          pageText.match(regex);

        if (matches) {
          score += matches.length;
        }
      });

      // --------------------------------------------------
      // FIND BEST LOCAL MATCH
      // --------------------------------------------------

      let bestLocalMatch = null;

      /*
       * IMPORTANT:
       * আমরা আর start = 0 থেকে পুরো page accumulate করছি না।
       *
       * প্রতিটি সম্ভাব্য starting item থেকে ছোট local window
       * তৈরি করছি।
       */

      for (
        let start = 0;
        start < normalizedItems.length;
        start++
      ) {

        const startItem = normalizedItems[start];

        if (!startItem.clean) {
          continue;
        }

        let windowItems = [];
        let windowWords = new Set();

        /*
         * Answer সাধারণত কয়েকটি PDF text item-এর মধ্যে থাকে।
         * তাই controlled window রাখছি।
         */

        const maxWindow =
          Math.max(
            answerWords.length * 2,
            25
          );

        for (
          let end = start;
          end < normalizedItems.length &&
          end < start + maxWindow;
          end++
        ) {

          const item = normalizedItems[end];

          if (!item.clean) {
            continue;
          }

          windowItems.push(item);

          // Exact word matching
          const itemWords =
            item.clean.split(/\s+/);

          for (const answerWord of answerWords) {

            if (itemWords.includes(answerWord)) {
              windowWords.add(answerWord);
            }
          }

          // ----------------------------------------------
          // CURRENT MATCH RATIO
          // ----------------------------------------------

          const matchedCount =
            windowWords.size;

          const ratio =
            matchedCount /
            answerWords.length;

          // ----------------------------------------------
          // SAVE GOOD LOCAL MATCH
          // ----------------------------------------------

          if (ratio >= 0.50) {

            const candidate = {
              items: [...windowItems],
              matchedCount,
              ratio
            };

            /*
             * Best candidate:
             * 1. বেশি matching words
             * 2. কম unnecessary items
             */

            if (
              !bestLocalMatch ||
              candidate.matchedCount >
                bestLocalMatch.matchedCount ||
              (
                candidate.matchedCount ===
                  bestLocalMatch.matchedCount &&
                candidate.items.length <
                  bestLocalMatch.items.length
              )
            ) {
              bestLocalMatch = candidate;
            }
          }

          /*
           * Answer-এর যথেষ্ট অংশ পাওয়া গেলে
           * unnecessarily নিচে আর যেও না।
           */

          if (ratio >= 0.85) {
            break;
          }
        }
      }

      // --------------------------------------------------
      // FALLBACK: SINGLE BEST ITEM
      // --------------------------------------------------

      if (!bestLocalMatch) {

        let bestItem = null;
        let bestItemScore = 0;

        for (const item of normalizedItems) {

          if (!item.clean) {
            continue;
          }

          const itemWords =
            item.clean.split(/\s+/);

          let itemScore = 0;

          for (const word of answerWords) {

            if (itemWords.includes(word)) {

              if (word.length >= 8) {
                itemScore += 5;
              } else {
                itemScore += 1;
              }
            }
          }

          if (itemScore > bestItemScore) {

            bestItemScore = itemScore;
            bestItem = item;
          }
        }

        if (bestItem) {

          bestLocalMatch = {
            items: [bestItem],
            matchedCount: bestItemScore,
            ratio:
              bestItemScore /
              answerWords.length
          };
        }
      }

      // --------------------------------------------------
      // CREATE BOX
      // --------------------------------------------------

      let matchedItems =
        bestLocalMatch
          ? bestLocalMatch.items
          : [];

      /*
       * শুধু যেসব items-এ answer-এর word আছে
       * সেগুলো দিয়ে starting position নির্ধারণ করবো।
       */

      const actualMatchedItems =
        matchedItems.filter(item => {

          const itemWords =
            item.clean.split(/\s+/);

          return answerWords.some(word =>
            itemWords.includes(word)
          );
        });

      if (actualMatchedItems.length > 0) {
        matchedItems = actualMatchedItems;
      }

      // --------------------------------------------------
      // REMOVE DUPLICATES
      // --------------------------------------------------

      matchedItems = [
        ...new Map(
          matchedItems.map(item => [
            item.index,
            item
          ])
        ).values()
      ];

      // --------------------------------------------------
      // SORT BY PDF POSITION
      // --------------------------------------------------

      matchedItems.sort((a, b) => {

        const ay = a.transform[5];
        const by = b.transform[5];

        /*
         * PDF coordinate:
         * বড় Y = উপরের দিকে
         */

        if (Math.abs(ay - by) > 3) {
          return by - ay;
        }

        return (
          a.transform[4] -
          b.transform[4]
        );
      });

      // --------------------------------------------------
      // LOG
      // --------------------------------------------------

      console.log(
        "Page:",
        pageNumber
      );

      console.log(
        "Matched Items Count:",
        matchedItems.length
      );

      console.log(
        "Matched Text:",
        matchedItems
          .map(i => i.str)
          .join(" ")
      );

      // --------------------------------------------------
      // CREATE BOUNDING BOX
      // --------------------------------------------------

      let box = null;

      if (matchedItems.length > 0) {

        const xs =
          matchedItems.map(
            i => i.transform[4]
          );

        const rights =
          matchedItems.map(
            i =>
              i.transform[4] +
              i.width
          );

        const tops =
          matchedItems.map(
            i =>
              i.transform[5] -
              i.height
          );

        const bottoms =
          matchedItems.map(
            i =>
              i.transform[5]
          );

        const padding = 5;

        const minX =
          Math.max(
            0,
            Math.min(...xs) -
              padding
          );

        const minY =
          Math.max(
            0,
            Math.min(...tops) -
              padding
          );

        const maxX =
          Math.min(
            viewport.width,
            Math.max(...rights) +
              padding
          );

        const maxY =
          Math.min(
            viewport.height,
            Math.max(...bottoms) +
              padding
          );

        box = {
          x: minX,
          y: minY,

          width:
            maxX - minX,

          height:
            maxY - minY,

          pageWidth:
            viewport.width,

          pageHeight:
            viewport.height,

          renderScale: 1
        };
      }

      // --------------------------------------------------
      // SAVE BEST PAGE
      // --------------------------------------------------

      if (
        box &&
        (
          !bestMatch ||
          score > bestMatch.score
        )
      ) {

        bestMatch = {
          score,

          page: pageNumber,

          pageText,

          items,

          box
        };

        console.log(
          "Best Match:",
          {
            page:
              bestMatch.page,

            score:
              bestMatch.score,

            box:
              bestMatch.box
          }
        );
      }
    }

    // --------------------------------------------------
    // RETURN
    // --------------------------------------------------

    if (
      bestMatch &&
      bestMatch.score > 0
    ) {

      return {
        found: true,

        page:
          bestMatch.page,

        pageText:
          bestMatch.pageText,

        items:
          bestMatch.items,

        box:
          bestMatch.box
      };
    }

    return {
      found: false,
      page: null,
      pageText: "",
      items: [],
      box: null
    };

  } catch (err) {

    console.error(
      "Answer Locator Error:",
      err
    );

    return {
      found: false,
      page: null,
      pageText: "",
      items: [],
      box: null
    };
  }
}

module.exports = {
  findAnswerPage
};
