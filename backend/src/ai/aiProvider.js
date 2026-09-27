const axios = require('axios');

class AIProvider {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'openai';
    this.model = process.env.AI_MODEL || 'gpt-4o';
    this.openaiKey = process.env.OPENAI_API_KEY;
    this.anthropicKey = process.env.ANTHROPIC_API_KEY;
    this.watsonxKey = process.env.WATSONX_API_KEY;
    this.watsonxProjectId = process.env.WATSONX_PROJECT_ID;
    this.watsonxUrl = process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com';
  }

  isAvailable() {
    if (this.provider === 'openai') return !!this.openaiKey;
    if (this.provider === 'anthropic') return !!this.anthropicKey;
    if (this.provider === 'ibm-watsonx') return !!(this.watsonxKey && this.watsonxProjectId);
    return false;
  }

  async complete(prompt, maxTokens = 500) {
    if (this.provider === 'openai') return this._openai(prompt, maxTokens);
    if (this.provider === 'anthropic') return this._anthropic(prompt, maxTokens);
    if (this.provider === 'ibm-watsonx') return this._watsonx(prompt, maxTokens);
    throw new Error(`Unknown AI provider: ${this.provider}`);
  }

  async _openai(prompt, maxTokens) {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.2
      },
      {
        headers: { Authorization: `Bearer ${this.openaiKey}`, 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );
    return response.data.choices[0].message.content.trim();
  }

  async _anthropic(prompt, maxTokens) {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: this.model || 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens
      },
      {
        headers: {
          'x-api-key': this.anthropicKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    return response.data.content[0].text.trim();
  }

  async _watsonx(prompt, maxTokens) {
    // Get IAM token first
    const tokenResp = await axios.post(
      'https://iam.cloud.ibm.com/identity/token',
      new URLSearchParams({ grant_type: 'urn:ibm:params:oauth:grant-type:apikey', apikey: this.watsonxKey }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
    );
    const iamToken = tokenResp.data.access_token;

    const response = await axios.post(
      `${this.watsonxUrl}/ml/v1/text/generation?version=2023-05-29`,
      {
        model_id: this.model || 'ibm/granite-13b-instruct-v2',
        input: prompt,
        parameters: { max_new_tokens: maxTokens, temperature: 0.2 },
        project_id: this.watsonxProjectId
      },
      {
        headers: { Authorization: `Bearer ${iamToken}`, 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );
    return response.data.results[0].generated_text.trim();
  }
}

module.exports = AIProvider;
