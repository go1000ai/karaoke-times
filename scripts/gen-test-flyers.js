const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

(async () => {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const apiKey = process.env.GEMINI_API_KEY;
  const promptConfig = require(process.cwd() + '/lib/flyer-prompts.json');

  // Fetch 3 events without flyers
  const { data: events } = await supabase
    .from('venue_events')
    .select('id, venue_id, day_of_week, event_name, dj, notes, venues(name)')
    .is('flyer_url', null)
    .eq('is_active', true)
    .limit(3);

  console.log('Events to generate:', events.map(e => `${e.venues?.name} - ${e.day_of_week} - ${e.event_name}`));

  for (const ev of events) {
    const venueName = ev.venues?.name || 'Venue';
    const text = `${ev.event_name} ${ev.notes || ''} ${ev.dj || ''}`.toLowerCase();

    // Detect style
    let styleName = 'neon_stage';
    for (const [style, keywords] of Object.entries(promptConfig.theme_keywords)) {
      if (keywords.some(kw => text.includes(kw))) { styleName = style; break; }
    }
    if (styleName === 'neon_stage') {
      const dayHints = promptConfig.day_style_hints[ev.day_of_week];
      if (dayHints) {
        const hash = text.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        styleName = dayHints[hash % dayHints.length];
      }
    }

    const style = promptConfig.styles[styleName] || promptConfig.styles['neon_stage'];
    const venueHash = venueName.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const [c1, c2] = style.colors[venueHash % style.colors.length];
    const prompt = style.prompt.replace(/\{color1\}/g, c1).replace(/\{color2\}/g, c2) + ' ' + promptConfig.base_instructions;

    console.log(`\nGenerating for ${venueName} (${ev.day_of_week}) — style: ${styleName}`);

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instances: [{ prompt }], parameters: { sampleCount: 1, aspectRatio: '4:3' } })
    });

    const data = await res.json();
    if (data.error) { console.log('ERROR:', data.error.message); continue; }

    const b64 = data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded;
    if (!b64) { console.log('No image data'); continue; }

    const buffer = Buffer.from(b64, 'base64');
    const fileName = `auto-flyers/${ev.id}-${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage.from('flyer-uploads').upload(fileName, buffer, { contentType: 'image/png', upsert: true });
    if (uploadError) { console.log('Upload error:', uploadError.message); continue; }

    const { data: urlData } = supabase.storage.from('flyer-uploads').getPublicUrl(fileName);
    const { error: updateError } = await supabase.from('venue_events').update({ flyer_url: urlData.publicUrl }).eq('id', ev.id);

    if (updateError) { console.log('DB error:', updateError.message); continue; }
    console.log('SUCCESS:', urlData.publicUrl.slice(-60));

    // Save locally for preview
    fs.writeFileSync(`/tmp/flyer-${ev.id.slice(0, 8)}.png`, buffer);
    console.log(`Saved preview: /tmp/flyer-${ev.id.slice(0, 8)}.png`);
  }
  console.log('\nDone!');
})();
