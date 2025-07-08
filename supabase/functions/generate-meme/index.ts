
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, tone, regenerate } = await req.json();
    
    if (!url) {
      throw new Error('URL is required');
    }

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Processing URL:', url, 'with tone:', tone);

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check cache first (unless regenerating)
    let articleData = null;
    if (!regenerate) {
      const { data: cachedData } = await supabase
        .from('url_cache')
        .select('*')
        .eq('url', url)
        .gt('expires_at', new Date().toISOString())
        .single();
      
      if (cachedData) {
        articleData = cachedData;
        console.log('Using cached data for URL:', url);
      }
    }

    // Scrape content if not cached
    if (!articleData) {
      console.log('Scraping content for URL:', url);
      
      try {
        const response = await fetch(url);
        const html = await response.text();
        
        // Basic HTML parsing to extract title and content
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : 'Article';
        
        // Extract content from common article tags
        const contentMatches = html.match(/<(?:p|article|div class="content")[^>]*>([^<]+)<\/(?:p|article|div)>/gi) || [];
        const content = contentMatches
          .map(match => match.replace(/<[^>]*>/g, ''))
          .join(' ')
          .slice(0, 2000); // Limit content length
        
        articleData = { url, title, content };
        
        // Cache the scraped data
        await supabase.from('url_cache').upsert({
          url,
          title,
          content,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });
        
        console.log('Scraped and cached content:', { title, contentLength: content.length });
      } catch (scrapeError) {
        console.error('Scraping failed:', scrapeError);
        articleData = { 
          url, 
          title: 'Article', 
          content: 'Content could not be extracted from this URL.' 
        };
      }
    }

    // Generate meme captions with OpenAI
    console.log('Generating captions with OpenAI...');
    
    const systemPrompt = `You are a meme caption generator. Given an article title and content, create funny meme captions that summarize the key point in a ${tone} tone. 

Return ONLY a JSON object with this exact format:
{
  "top_text": "TOP CAPTION TEXT",
  "bottom_text": "BOTTOM CAPTION TEXT"
}

Guidelines:
- Keep each caption under 30 characters
- Make it relatable and shareable
- Capture the essence of the article
- Use appropriate ${tone} tone
- Make it meme-worthy`;

    const userPrompt = `Article: "${articleData.title}"
Content: "${articleData.content.slice(0, 1000)}"`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 150,
        temperature: 0.8,
      }),
    });

    const openaiData = await openaiResponse.json();
    
    if (!openaiData.choices?.[0]?.message?.content) {
      throw new Error('Failed to generate captions');
    }

    let captions;
    try {
      captions = JSON.parse(openaiData.choices[0].message.content);
    } catch {
      // Fallback if JSON parsing fails
      captions = {
        top_text: "WHEN YOU READ THE ARTICLE",
        bottom_text: "AND REALIZE IT'S JUST CLICKBAIT"
      };
    }

    console.log('Generated captions:', captions);

    // Generate meme image URL using memegen.link
    const topText = encodeURIComponent(captions.top_text || "TOP TEXT");
    const bottomText = encodeURIComponent(captions.bottom_text || "BOTTOM TEXT");
    const templateId = "drake"; // Default template, could be randomized
    const memeImageUrl = `https://api.memegen.link/images/${templateId}/${topText}/${bottomText}.jpg`;

    console.log('Generated meme URL:', memeImageUrl);

    // Save to database
    const { data: savedMeme, error: saveError } = await supabase
      .from('meme_generations')
      .insert({
        url,
        article_title: articleData.title,
        article_content: articleData.content,
        tone,
        template_id: templateId,
        top_text: captions.top_text,
        bottom_text: captions.bottom_text,
        meme_image_url: memeImageUrl,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving meme:', saveError);
      throw saveError;
    }

    console.log('Meme saved successfully:', savedMeme.id);

    return new Response(JSON.stringify(savedMeme), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-meme function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
