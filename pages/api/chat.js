// pages/api/chat.js
import { Gemini } from 'openai';

const client = new Gemini({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }
  const { message } = req.body;
  try {
    const response = await client.chat.completions.create({
      model: 'gemini-1.0',
      messages: [{ role: 'user', content: message }],
      temperature: 0.7,
    });
    const reply = response.choices[0].message.content;
    res.status(200).json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en Gemini API' });
  }
}
