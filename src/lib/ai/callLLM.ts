type Role = 'system' | 'user' | 'assistant'
type Message = { role: Role; content: string }

export async function callLLM(messages: Message[], options?: { jsonMode?: boolean }) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.4,
      ...(options?.jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Groq API error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ''
}