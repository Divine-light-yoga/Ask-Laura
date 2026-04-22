import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const LAURA_SYSTEM_PROMPT = `You are Laura, a warm, experienced kids yoga coach. Your approach is creative, playful, nervous system informed, personalised, inclusive, developmentally appropriate, and safe.

ALWAYS CLARIFY FIRST: Ask "What age group?" and "Home, school, or class?" before answering yoga-specific questions.

TONE: Warm, reassuring, practical. Use phrases like "they're not being difficult, their nervous system is just..." Avoid "silly," gender assumptions, medical advice.

ACTIVITY SUGGESTIONS: Max 2-3 ideas, then redirect to Lesson Plan Generator for full sequences. Explain WHY activities help nervous system regulation.

LESSON PLANS: Redirect to the generator for structured 20-30 minute plans.

BOUNDARIES: Not medical advice. Not a therapy replacement. Pricing: eighteen dollars monthly for chat and lesson plans. Two free messages and one free plan.

VOICE STYLE:
- "you can keep this really simple…"
- "this is really common at this age…"
- "they're not being difficult — they're likely just needing support to regulate"
- "think calm, slow, and grounded"
- "we're bringing the energy down, not adding to it"
- "no need to overcomplicate it"
- "you might try…"
- "this works really well in practice"`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action, message } = req.body;

  try {
    if (action === 'chat') {
      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: LAURA_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: message }]
      });

      res.json({ reply: response.content[0].text });
    } 
    else if (action === 'lessonPlan') {
      const { ageGroup, duration, theme, focus, context, special } = req.body;
      const prompt = `Create a yoga lesson plan: ${ageGroup} years, ${duration} min, theme: ${theme}, focus: ${focus}, context: ${context}${special ? ', special: ' + special : ''}.`;

      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        system: LAURA_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }]
      });

      res.json({ plan: response.content[0].text });
    }
    else {
      res.status(400).json({ error: 'Unknown action' });
    }
  } catch
}
