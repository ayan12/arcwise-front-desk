import gentology from './gentology.js';
import arcwise from './arcwise.js';

// One line per client. The key is what goes in data-client="..." on their site.
export const CLIENTS = { gentology, arcwise };

export function getClient(id) {
  return Object.prototype.hasOwnProperty.call(CLIENTS, id) ? CLIENTS[id] : null;
}

// What the browser is allowed to see: no knowledge, rules or limits.
export function publicConfig(c) {
  return {
    id: c.id, name: c.name, assistant: c.assistant, theme: c.theme,
    greeting: c.greeting, quickReplies: c.quickReplies,
    tagline: c.tagline || null, teaser: c.teaser || null, tiles: c.tiles || [],
  };
}
