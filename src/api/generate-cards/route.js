async function handler({
  topic,
  targetAudience,
  language,
  specialNotes,
  numberOfQuestions,
  contentType,
}) {
  if (!topic || !topic.trim()) {
    return { error: "Onderwerp is verplicht" };
  }

  const isStatements = contentType === "statements";
  const cardCount = Math.min(
    Math.max(parseInt(numberOfQuestions) || 15, 1),
    30
  );

  const contentTypeText = isStatements ? "stellingen" : "vragen";
  const audienceText = targetAudience ? ` voor ${targetAudience}` : "";
  const languageText = language ? ` in het ${language}` : " in het Nederlands";
  const notesText = specialNotes ? ` Let op: ${specialNotes}` : "";

  const prompt = `Genereer ${cardCount} ${contentTypeText} over het onderwerp "${topic}"${audienceText}${languageText}.${notesText}

${
  isStatements
    ? "Maak stellingen die tot discussie uitnodigen. Elke stelling moet duidelijk en prikkelend zijn."
    : "Maak open vragen die tot gesprek uitnodigen. Elke vraag moet duidelijk en interessant zijn."
}

Geef alleen de ${contentTypeText} terug, elk op een nieuwe regel, zonder nummering of extra tekst.`;

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        error: "ANTHROPIC_API_KEY omgevingsvariabele niet ingesteld",
      };
    }

    const apiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return {
        error: `API fout (status ${apiResponse.status}): ${errorText}`,
      };
    }

    const data = await apiResponse.json();

    if (!data || !data.content || !Array.isArray(data.content) || data.content.length === 0) {
      return {
        error: `Onverwachte API response structuur. Data ontvangen: ${JSON.stringify(
          data
        )}`,
      };
    }

    const generatedText = data.content[0]?.text;

    if (!generatedText) {
      return {
        error: `Geen content in API response. Volledige response: ${JSON.stringify(
          data
        )}`,
      };
    }

    const lines = generatedText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .filter((line) => !line.match(/^\d+\.?\s/));

    const cards = lines.map((line) => ({ question: line }));

    if (cards.length === 0) {
      return {
        error: `Geen geldige kaarten gevonden in gegenereerde tekst: ${generatedText}`,
      };
    }

    return { cards };
  } catch (error) {
    return {
      error: `Exception: ${error.message}. Stack: ${error.stack}`,
    };
  }
}

export async function POST(request) {
  const body = await request.json();
  const result = await handler(body);

  const headers = {
    "Content-Type": "application/json",
  };

  if (result.error) {
    return new Response(JSON.stringify(result), { status: 400, headers });
  }

  return new Response(JSON.stringify(result), { status: 200, headers });
}
