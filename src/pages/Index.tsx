
import { useState } from "react";
import { MemeGenerator } from "@/components/MemeGenerator";
import { MemeDisplay } from "@/components/MemeDisplay";
import { RecentMemes } from "@/components/RecentMemes";

export interface MemeData {
  id: string;
  url: string;
  article_title: string;
  tone: string;
  top_text: string;
  bottom_text: string;
  meme_image_url: string;
  template_id?: string;
  created_at: string;
}

const Index = () => {
  const [currentMeme, setCurrentMeme] = useState<MemeData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            MemeWire
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Transform any article into a viral meme instantly with AI-powered content analysis
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {!currentMeme ? (
            <div className="space-y-8">
              <MemeGenerator 
                onMemeGenerated={setCurrentMeme} 
                isGenerating={isGenerating}
                setIsGenerating={setIsGenerating}
              />
              <RecentMemes onMemeSelect={setCurrentMeme} />
            </div>
          ) : (
            <MemeDisplay 
              meme={currentMeme} 
              onBack={() => setCurrentMeme(null)}
              onRegenerate={setCurrentMeme}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
