import type { DataFunctionArgs } from "@remix-run/cloudflare";

export const loader = async ({ request, context }: DataFunctionArgs) => {
  const { searchParams } = new URL(request.url);
  const prompt = searchParams.get("prompt");

  if (!prompt) {
    return new Response("Missing prompt", { status: 400 });
  }

  return fetch(`https://api.openai.com/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${context.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      stream: true,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });
};
