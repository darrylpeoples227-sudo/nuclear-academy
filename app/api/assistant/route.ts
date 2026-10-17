import { generateText } from 'ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const messages = Array.isArray(body.messages) ? body.messages : []
    const result = await generateText({
      model: 'openai/gpt-4.1-mini',
      system: 'You are Nuclear Academy Assistant, a friendly, encouraging tutor for students. Help with math, science, social studies, reading, homework, ideas, study plans, and everyday questions. Explain clearly, show steps for math, encourage learning, and say when you are unsure. Keep answers age-appropriate and concise.',
      messages: messages.slice(-20).map((message: { role: string; content: string }) => ({
        role: message.role === 'assistant' ? 'assistant' : 'user',
        content: String(message.content).slice(0, 6000),
      })),
    })
    return NextResponse.json({ text: result.text })
  } catch {
    return NextResponse.json({ error: 'The assistant is unavailable right now.' }, { status: 500 })
  }
}
