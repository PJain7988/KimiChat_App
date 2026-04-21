/**
 * ID Comparison Utility
 * Ensures that MongoDB ObjectIds and Strings are compared correctly.
 */
export const isSameId = (id1, id2) => {
  if (!id1 || !id2) return false;
  return String(id1) === String(id2);
};

/**
 * Get the other user in a 1-to-1 chat.
 */
export const getChatOtherUser = (chat, currentUserId) => {
  if (!chat || chat.isGroup || chat.isAI || !chat.participants) return null;
  return chat.participants.find(p => {
    const pId = typeof p === 'object' ? (p._id || p) : p;
    return !isSameId(pId, currentUserId);
  }) || null;
};
