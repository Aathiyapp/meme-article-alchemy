
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Share2, RefreshCw, Loader2 } from "lucide-react";
import { MemeData } from "@/pages/Index";
import { ShareButtons } from "@/components/ShareButtons";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MemeDisplayProps {
  meme: MemeData;
  onBack: () => void;
  onRegenerate: (meme: MemeData) => void;
}

export const MemeDisplay = ({ meme, onBack, onRegenerate }: MemeDisplayProps) => {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { toast } = useToast();

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    
    try {
      console.log("Regenerating meme for URL:", meme.url);
      
      const { data, error } = await supabase.functions.invoke('generate-meme', {
        body: { 
          url: meme.url, 
          tone: meme.tone,
          regenerate: true 
        }
      });

      if (error) {
        console.error("Error regenerating meme:", error);
        throw error;
      }

      console.log("Meme regenerated successfully:", data);
      onRegenerate(data);
      
      // Track regeneration
      await supabase.from('meme_analytics').insert({
        meme_id: data.id,
        action_type: 'regenerate'
      });
      
      toast({
        title: "Meme Regenerated!",
        description: "Your meme has been updated with new content",
      });
      
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Regeneration Failed",
        description: "Failed to regenerate meme. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(meme.meme_image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memewire-meme-${meme.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Track download
      await supabase.from('meme_analytics').insert({
        meme_id: meme.id,
        action_type: 'download'
      });
      
      toast({
        title: "Download Started",
        description: "Your meme is being downloaded",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download meme. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Button 
        onClick={onBack} 
        variant="outline" 
        className="bg-white/80 backdrop-blur-sm hover:bg-white/90"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Generator
      </Button>

      <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">
            {meme.article_title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <img 
              src={meme.meme_image_url} 
              alt="Generated meme" 
              className="max-w-full h-auto rounded-lg shadow-lg"
            />
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <Button 
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </>
              )}
            </Button>
            
            <Button onClick={handleDownload} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            
            <ShareButtons meme={meme} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
