/* Dungeon of Shadows - Optional LLM Narrator Abstraction Layer */

window.DOS = window.DOS || {};

(function (DOS) {
  'use strict';

  class NarratorSystem {
    constructor() {
      this.status = 'Off'; // Off, Connecting, On, Failed
    }

    async generateQuestText(questData, state) {
      if (!state.narrator || !state.narrator.enabled) {
        return questData.desc; // Procedural fallback
      }

      try {
        const prompt = `Rewrite this fantasy RPG quest description in atmospheric dark fantasy prose (1-2 sentences): "${questData.desc}"`;
        const resText = await this.callLLM(prompt, state.narrator);
        return resText ? resText : questData.desc;
      } catch (err) {
        console.warn('LLM Narrator fallback triggered:', err);
        return questData.desc;
      }
    }

    async generateNPCDialogue(npc, context, state) {
      if (!state.narrator || !state.narrator.enabled) {
        return `${npc.name} (${npc.occupation}): "Greetings traveler. Be careful on the roads."`;
      }

      try {
        const prompt = `Generate a single short line of RPG tavern dialogue for an NPC named ${npc.name}, a ${npc.race} ${npc.occupation}.`;
        const resText = await this.callLLM(prompt, state.narrator);
        return resText ? `${npc.name}: "${resText}"` : `${npc.name}: "Greetings traveler."`;
      } catch (err) {
        return `${npc.name}: "Greetings traveler."`;
      }
    }

    async callLLM(prompt, config) {
      if (config.provider === 'openai' && config.endpoint) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

        const response = await fetch(`${config.endpoint}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {})
          },
          body: JSON.stringify({
            model: config.model || 'llama3',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 100,
            temperature: 0.7
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        if (!response.ok) return null;

        const data = await response.json();
        if (data && data.choices && data.choices[0] && data.choices[0].message) {
          return data.choices[0].message.content.trim();
        }
      }
      return null;
    }
  }

  DOS.NarratorSystem = NarratorSystem;

})(window.DOS);
