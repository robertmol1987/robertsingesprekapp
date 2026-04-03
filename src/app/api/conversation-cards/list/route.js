async function handler({ search, limit = 10, offset = 0 }) {
  try {
    const cards = await sql(
      `
      SELECT * FROM conversation_cards 
      WHERE 
        $1::text IS NULL 
        OR topic ILIKE '%' || $1 || '%'
        OR target_audience ILIKE '%' || $1 || '%'
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `,
      [search || null, limit, offset]
    );

    const [count] = await sql`
      SELECT COUNT(*) FROM conversation_cards
    `;

    return {
      cards,
      total: parseInt(count.count),
    };
  } catch (error) {
    console.error("Error listing conversation cards:", error);
    return { error: "Failed to list conversation cards" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}