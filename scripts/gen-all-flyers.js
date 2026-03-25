const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const promptConfig = require(process.cwd() + '/lib/flyer-prompts.json');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const apiKey = process.env.GEMINI_API_KEY;

function detectStyle(eventName, notes, dj, dayOfWeek) {
  const text = `${eventName} ${notes} ${dj}`.toLowerCase();
  for (const [style, keywords] of Object.entries(promptConfig.theme_keywords)) {
    if (keywords.some(kw => text.includes(kw))) return style;
  }
  const dayHints = promptConfig.day_style_hints[dayOfWeek];
  if (dayHints && dayHints.length > 0) {
    const hash = text.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return dayHints[hash % dayHints.length];
  }
  return 'neon_stage';
}

function buildPrompt(styleName, venueHash) {
  const style = promptConfig.styles[styleName] || promptConfig.styles['neon_stage'];
  const [c1, c2] = style.colors[venueHash % style.colors.length];
  return style.prompt.replace(/\{color1\}/g, c1).replace(/\{color2\}/g, c2) + ' ' + promptConfig.base_instructions;
}

async function generateImage(prompt) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ instances: [{ prompt }], parameters: { sampleCount: 1, aspectRatio: '4:3' } })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const b64 = data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded;
  if (!b64) throw new Error('No image data');
  return Buffer.from(b64, 'base64');
}

(async () => {
  const { data: events } = await supabase
    .from('venue_events')
    .select('id, venue_id, day_of_week, event_name, dj, notes, venues(name)')
    .is('flyer_url', null)
    .eq('is_active', true)
    .order('day_of_week');

  console.log(`\n=== Generating ${events.length} flyers via Imagen 4.0 ===\n`);

  let generated = 0, failed = 0;
  const BATCH_SIZE = 2;

  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(batch.map(async (ev) => {
      const venueName = ev.venues?.name || 'Venue';
      const styleName = detectStyle(ev.event_name || '', ev.notes || '', ev.dj || '', ev.day_of_week || '');
      const venueHash = venueName.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const prompt = buildPrompt(styleName, venueHash);

      const buffer = await generateImage(prompt);
      const fileName = `auto-flyers/${ev.id}-${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage.from('flyer-uploads').upload(fileName, buffer, { contentType: 'image/png', upsert: true });
      if (uploadError) throw new Error('Upload: ' + uploadError.message);

      const { data: urlData } = supabase.storage.from('flyer-uploads').getPublicUrl(fileName);
      const { error: updateError } = await supabase.from('venue_events').update({ flyer_url: urlData.publicUrl }).eq('id', ev.id);
      if (updateError) throw new Error('DB: ' + updateError.message);

      return { venue: venueName, day: ev.day_of_week, style: styleName };
    }));

    for (const r of results) {
      if (r.status === 'fulfilled') {
        generated++;
        const v = r.value;
        console.log(`  [${generated}/${events.length}] ${v.venue} (${v.day}) — ${v.style}`);
      } else {
        failed++;
        console.log(`  [FAIL] ${r.reason?.message?.slice(0, 100)}`);
      }
    }

    // Rate limit pause
    if (i + BATCH_SIZE < events.length) {
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  console.log(`\n=== Done: ${generated} generated, ${failed} failed ===\n`);
})();
