
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { MemeData } from "@/pages/Index";
import { Clock } from "lucide-react";

interface RecentMemesProps {
  onMemeSelect: (meme: MemeData) => void;
}

export const RecentMemes = ({ onMemeSelect }: RecentMemesProps) => {
  const [recentMemes, setRecentMemes] = useState<MemeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentMemes = async () => {
      try {
        const { data, error } = await supabase
          .from('meme_generations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(6);

        if (error) {
          console.error("Error fetching recent memes:", error);
          return;
        }

        setRecentMemes(data || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentMemes();
  }, []);

  if (loading) {
    return (
      <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Memes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recentMemes.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Memes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {recentMemes.map((meme) => (
            <div
              key={meme.id}
              className="cursor-pointer hover:scale-105 transition-transform"
              onClick={() => onMemeSelect(meme)}
            >
              <img
                src={meme.meme_image_url}
                alt={meme.article_title}
                className="w-full aspect-square object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
