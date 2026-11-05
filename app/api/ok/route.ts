const TOPIC = "please-unblock-me-ok-7k2m9x";

export async function POST() {
  try {
    await fetch(`https://ntfy.sh/${TOPIC}`, {
      method: "POST",
      headers: {
        Title: "Someone clicked OK",
        Priority: "high",
        Tags: "white_check_mark",
      },
      body: "They unblocked you (or at least clicked OK).",
    });
  } catch {
    // Don't fail the click if notify is down
  }

  return Response.json({ ok: true });
}
