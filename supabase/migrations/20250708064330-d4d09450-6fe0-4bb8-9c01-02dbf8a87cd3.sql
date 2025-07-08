
-- Create enum for meme tones
CREATE TYPE public.meme_tone AS ENUM ('best-fit', 'sarcastic', 'wholesome', 'ironic');

-- Create table for meme generations
CREATE TABLE public.meme_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  article_title TEXT,
  article_content TEXT,
  tone meme_tone NOT NULL,
  template_id TEXT,
  top_text TEXT NOT NULL,
  bottom_text TEXT NOT NULL,
  meme_image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create table for analytics tracking
CREATE TABLE public.meme_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meme_id UUID REFERENCES public.meme_generations(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL, -- 'download', 'share_x', 'share_telegram', 'share_instagram', 'regenerate'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create table for URL content cache (to avoid re-scraping same URLs)
CREATE TABLE public.url_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  title TEXT,
  content TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

-- Enable Row Level Security
ALTER TABLE public.meme_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meme_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.url_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meme_generations (allow read for everyone, but track user if logged in)
CREATE POLICY "Allow public read access to meme_generations" 
  ON public.meme_generations 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert to meme_generations" 
  ON public.meme_generations 
  FOR INSERT 
  WITH CHECK (true);

-- RLS Policies for meme_analytics (allow insert for tracking)
CREATE POLICY "Allow public insert to meme_analytics" 
  ON public.meme_analytics 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public read access to meme_analytics" 
  ON public.meme_analytics 
  FOR SELECT 
  USING (true);

-- RLS Policies for url_cache (allow read/write for caching)
CREATE POLICY "Allow public access to url_cache" 
  ON public.url_cache 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_meme_generations_url ON public.meme_generations(url);
CREATE INDEX idx_meme_generations_created_at ON public.meme_generations(created_at DESC);
CREATE INDEX idx_meme_analytics_meme_id ON public.meme_analytics(meme_id);
CREATE INDEX idx_meme_analytics_action_type ON public.meme_analytics(action_type);
CREATE INDEX idx_url_cache_url ON public.url_cache(url);
CREATE INDEX idx_url_cache_expires_at ON public.url_cache(expires_at);
