import React from 'react';

interface Props {
  playAnimation: boolean;
}

export default function D3BarOptions({ playAnimation }: Props) {
  return (
    <div className="noselect" style={{ height: '100%', width: '100%', border: '1px solid black' }}>
      {/* Placeholder for D3BarOptions - React version */}
      D3BarOptions Component (animation: {playAnimation ? 'on' : 'off'})
    </div>
  );
}
