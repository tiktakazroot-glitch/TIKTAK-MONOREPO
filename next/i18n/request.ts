import fs from 'fs';
import path from 'path';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

function loadMessages(locale: string): Record<string, any> {
  const messagesDir = path.join(process.cwd(), 'i18n', 'messages');
  const messages: Record<string, any> = {};

  if (!fs.existsSync(messagesDir)) return messages;

  const files = fs.readdirSync(messagesDir);
  const pattern = new RegExp(`^(.*)\\.${locale}\\.json$`);

  for (const file of files) {
    const match = file.match(pattern);
    if (match) {
      const content = fs.readFileSync(path.join(messagesDir, file), 'utf-8');
      messages[match[1]] = JSON.parse(content);
    }
  }

  return messages;
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: loadMessages(locale)
  };
});

