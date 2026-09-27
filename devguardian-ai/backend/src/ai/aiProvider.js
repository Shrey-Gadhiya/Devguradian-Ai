/**
 * AI Provider — supports OpenAI, Anthropic, IBM watsonx, or none (rule-based only)
 */
const axios = require('axios');

const PROVIDER = process.env.AI_PROVIDER || 'none';

async function generateText(prompt, options = {}) {
  const maxTokens = options.maxTokens || 800;

  if (PROVIDER === 'openai') {
    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.2,
      },
      { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
    );
    return res.data.choices[0].message.content.trim();
  }

  if (PROVIDER === 'anthropic') {
    const res = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
      }
    );
    return res.data.content[0].text.trim();
  }

  if (PROVIDER === 'watsonx') {
    const token = await getWatsonxToken();
    const res = await axios.post(
      `${process.env.WATSONX_URL}/ml/v1/text/generation?version=2023-05-29`,
      {
        model_id: process.env.WATSONX_MODEL || 'ibm/granite-34b-code-instruct',
        input: prompt,
        parameters: { max_new_tokens: maxTokens, temperature: 0.2 },
        project_id: process.env.WATSONX_PROJECT_ID,
      },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    return res.data.results[0].generated_text.trim();
  }

  // No AI provider — return null so callers use rule-based fallback
  return null;
}

async function getWatsonxToken() {
  const res = await axios.post(
    'https://iam.cloud.ibm.com/identity/token',
    new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: process.env.WATSONX_API_KEY,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return res.data.access_token;
}

module.exports = { generateText };
