export function trackMapClick(entity, { isPartner, source }) {
  let userId = null;
  try {
    userId = localStorage.getItem("userId");
  } catch {}
  if (!userId || !entity?.id) return;

  fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/eatdoko/events/map`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      id: entity.id,
      name: entity.name,
      branch_location: entity.branch_location,
      isPartner,
      source,
    }),
    keepalive: true,
  }).catch(() => {});
}