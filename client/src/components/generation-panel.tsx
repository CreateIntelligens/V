import React from 'react';

interface GenerationPanelProps {
  children: React.ReactNode;
}

export function GenerationPanel({ children }: GenerationPanelProps) {
  return (
    <div className="space-y-4">
      {children}
    </div>
  );
}
