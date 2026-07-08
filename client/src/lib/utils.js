export function formatMessageTime(date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
export const formatChatDate = (date) => {
  const today = new Date();
  const messageDate = new Date(date);

  const isToday =
    today.toDateString() === messageDate.toDateString();

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isYesterday =
    yesterday.toDateString() === messageDate.toDateString();

  if (isToday) return "Today";

  if (isYesterday) return "Yesterday";

  return messageDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};