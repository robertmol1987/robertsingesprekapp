async function handler({ id }) {
  if (!id) {
    return { error: "Missing card ID" };
  }

  try {
    const result = await sql`
      SELECT * FROM conversation_cards 
      WHERE id = ${id}
    `;

    return result.length ? { card: result[0] } : { error: "Card not found" };
  } catch (error) {
    console.error("Error getting conversation cards:", error);
    return { error: "Failed to get conversation cards" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}