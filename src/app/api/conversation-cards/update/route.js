async function handler({ id, topic, targetAudience, specialNotes }) {
  if (!id) {
    return { error: "ID is required" };
  }

  const updates = [];
  const values = [id];
  let paramCount = 1;

  if (topic !== undefined) {
    paramCount++;
    values.push(topic);
    updates.push(`topic = $${paramCount}`);
  }

  if (targetAudience !== undefined) {
    paramCount++;
    values.push(targetAudience);
    updates.push(`target_audience = $${paramCount}`);
  }

  if (specialNotes !== undefined) {
    paramCount++;
    values.push(specialNotes);
    updates.push(`special_notes = $${paramCount}`);
  }

  if (updates.length === 0) {
    return { error: "No updates provided" };
  }

  const queryString = `
    UPDATE conversation_cards 
    SET ${updates.join(", ")} 
    WHERE id = $1 
    RETURNING *
  `;

  const [updatedCard] = await sql(queryString, values);

  if (!updatedCard) {
    return { error: "Conversation cards not found" };
  }

  return updatedCard;
}
export async function POST(request) {
  return handler(await request.json());
}