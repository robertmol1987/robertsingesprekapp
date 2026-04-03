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
    const apiResponse = await fetch("/integrations/chat-gpt/conversationgpt4", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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

    if (
      !data ||
      !data.choices ||
      !Array.isArray(data.choices) ||
      data.choices.length === 0
    ) {
      return {
        error: `Onverwachte API response structuur. Data ontvangen: ${JSON.stringify(
          data
        )}`,
      };
    }

    const generatedText = data.choices[0]?.message?.content;

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
  return handler(await request.json());
}