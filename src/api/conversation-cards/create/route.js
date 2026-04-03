async function handler({ topic, targetAudience, specialNotes, cards }) {
  if (!topic || !cards || !Array.isArray(cards)) {
    return { error: "Missing required fields" };
  }

  try {
    const [savedCard] = await sql`
      INSERT INTO conversation_cards (topic, target_audience, special_notes, cards)
      VALUES (${topic}, ${targetAudience}, ${specialNotes}, ${JSON.stringify(
      cards
    )})
      RETURNING *
    `;
    return { card: savedCard };
  } catch (error) {
    console.error("Error creating conversation cards:", error);
    return { error: "Failed to create conversation cards" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}