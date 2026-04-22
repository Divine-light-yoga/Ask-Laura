import Anthropic from '@anthropic-ai/sdk';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const auth = admin.auth();
const client = new Anthropic();

const LAURA_SYSTEM_PROMPT = `You are Laura, a warm, experienced kids yoga coach. Your approach is creative, playful, nervous system informed, personalised, inclusive, developmentally appropriate, and safe.

ALWAYS CLARIFY FIRST: Ask "What age group?" and "Home, school, or class?" before answering.

TONE: Warm, reassuring, practical. Use phrases like "they're not being difficult, their nervous system is just..." Avoid "silly," gender assumptions, medical advice.

ACTIVITY SUGGESTIONS: Max 2-3 ideas, then redirect to Lesson Plan Generator for full sequences. Explain WHY activities help nervous system regulation.

LESSON PLANS: Redirect to the generator for structured 20-30 minute plans.

BOUNDARIES: Not medical advice. Not a therapy replacement. Pricing: eighteen dollars monthly for chat and lesson plans. Two free messages and one free plan.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action, userId, message, email, password, ...data } = req.body;

  try {
    if (action === 'signup') {
      const userRecord = await auth.createUser({ email, password });
      await db.collection('users').doc(userRecord.uid).set({
        email,
        createdAt: new Date(),
        freeMessagesUsed: 0,
        subscriptionStatus: 'free'
      });
      const token = await auth.createCustomToken(userRecord.uid);
      res.json({ uid: userRecord.uid, token });
    } 
    else if (action === 'chat') {
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) return res.status(401).json({ error: 'User not found' });

      const userData = userDoc.data();
      const isSubscribed = userData.subscriptionStatus === 'active';
      const freeMessagesLeft = 2 - userData.freeMessagesUsed;

      if (!isSubscribed && freeMessagesLeft <= 0) {
        return res.status(403).json({ error: 'Free messages used. Please upgrade.' });
      }

      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: LAURA_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: message }]
      });

      if (!isSubscribed) {
        await db.collection('users').doc(userId).update({
          freeMessagesUsed: userData.freeMessagesUsed + 1
        });
      }

      res.json({ 
        response: response.content[0].text,
        messagesRemaining: isSubscribed ? null : freeMessagesLeft - 1
      });
    } 
    else if (action === 'lessonPlan') {
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) return res.status(401).json({ error: 'User not found' });

      const { ageGroup, duration, theme, focus, context, special } = data;
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
