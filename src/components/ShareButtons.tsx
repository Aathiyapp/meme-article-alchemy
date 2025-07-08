
import { Button } from "@/components/ui/button";
import { Share2, MessageCircle } from "lucide-react";
import { MemeData } from "@/pages/Index";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonsProps {
  meme: MemeData;
}

export const ShareButtons = ({ meme }: ShareButtonsProps) => {
  const { toast } = useToast();

  const trackShare = async (platform: string) => {
    try {
      await supabase.from('meme_analytics').insert({
        meme_id: meme.id,
        action_type: `share_${platform}`
      });
    } catch (error) {
      console.error("Error tracking share:", error);
    }
  };

  const shareToX = () => {
    const text = `Check out this meme I made from "${meme.article_title}" 🔥`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(meme.meme_image_url)}`;
    window.open(url, '_blank');
    trackShare('x');
    toast({
      title: "Sharing to X",
      description: "Opening X in a new tab",
    });
  };

  const shareToTelegram = () => {
    const text = `Check out this meme I made: ${meme.meme_image_url}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(meme.meme_image_url)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    trackShare('telegram');
    toast({
      title: "Sharing to Telegram",
      description: "Opening Telegram in a new tab",
    });
  };

  const shareToInstagram = () => {
    // Instagram doesn't support direct URL sharing, so we'll copy the image URL
    navigator.clipboard.writeText(meme.meme_image_url).then(() => {
      trackShare('instagram');
      toast({
        title: "Image URL Copied",
        description: "Paste the URL in Instagram to share your meme",
      });
    });
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <Button onClick={shareToX} variant="outline" size="sm">
        <Share2 className="w-4 h-4 mr-1" />
        X (Twitter)
      </Button>
      <Button onClick={shareToTelegram} variant="outline" size="sm">
        <MessageCircle className="w-4 h-4 mr-1" />
        Telegram
      </Button>
      <Button onClick={shareToInstagram} variant="outline" size="sm">
        <Share2 className="w-4 h-4 mr-1" />
        Instagram
      </Button>
    </div>
  );
};
