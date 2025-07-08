
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MemeData } from "@/pages/Index";

interface MemeGeneratorProps {
  onMemeGenerated: (meme: MemeData) => void;
  isGenerating: boolean;
  setIsGenerating: (loading: boolean) => void;
}

export const MemeGenerator = ({ onMemeGenerated, isGenerating, setIsGenerating }: MemeGeneratorProps) => {
  const [url, setUrl] = useState("");
  const [tone, setTone] = useState<string>("best-fit");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid article URL",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log("Generating meme for URL:", url, "with tone:", tone);
      
      // Call the edge function to generate the meme
      const { data, error } = await supabase.functions.invoke('generate-meme', {
        body: { url, tone }
      });

      if (error) {
        console.error("Error generating meme:", error);
        throw error;
      }

      console.log("Meme generated successfully:", data);
      onMemeGenerated(data);
      
      toast({
        title: "Meme Generated!",
        description: "Your meme is ready to share",
      });
      
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate meme. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          Generate Your Meme
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="url" className="text-sm font-medium">
              Article URL
            </Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-12"
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone" className="text-sm font-medium">
              Meme Tone
            </Label>
            <Select value={tone} onValueChange={setTone} disabled={isGenerating}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select a tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="best-fit">Best Fit</SelectItem>
                <SelectItem value="sarcastic">Sarcastic</SelectItem>
                <SelectItem value="wholesome">Wholesome</SelectItem>
                <SelectItem value="ironic">Ironic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Meme...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Meme
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
