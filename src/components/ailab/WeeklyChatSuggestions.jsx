import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const FALLBACK = [
  'Compare the main risks for equities, bonds and gold in a table.',
  'Which central bank decisions should I watch this week?',
  'How do inflation surprises affect bonds and equities?',
  'Which economic releases matter most for currency markets?',
  'How should I assess geopolitical risk across asset classes?',
  'What should I look for in corporate earnings guidance?',
  'How do oil supply changes affect inflation expectations?',
  'Which indicators help assess the global growth outlook?',
];

export default function WeeklyChatSuggestions({ onSelect }) {
  const { data } = useQuery({
    queryKey: ['weeklyChatStarters'],
    queryFn: async () => {
      const { items } = await base44.entities.WeeklyChatStarters.filter(
        { key: 'current' }, { sort: '-updated_date', limit: 1 }
      );
      return items[0] || null;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
  const fresh = data?.questions?.length === 8
    && Date.now() - Date.parse(data.generated_at) < 8 * 86400000;
  const questions = fresh ? data.questions.map(item => item.text) : FALLBACK;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-2xl">
      {questions.map(text => (
        <button key={text} onClick={() => onSelect(text)}
          className="rounded-lg border border-border/50 bg-background/30 px-4 py-3 text-left text-sm text-muted-foreground hover:text-foreground hover:border-primary/20 hover:bg-background/50 transition-colors duration-200">
          {text}
        </button>
      ))}
    </div>
  );
}