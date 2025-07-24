import React from 'react';
import { Switch, Button } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';

interface Props {
  playAnimation: boolean;
  onTogglePlay: () => void;
  isComposition: boolean;
  onToggleMode: () => void;
}

export default function D3BarButton({
  playAnimation,
  onTogglePlay,
  isComposition,
  onToggleMode,
}: Props) {
  return (
    <div className="button_group">
      <Switch
        checked={isComposition}
        onChange={onToggleMode}
        checkedChildren="Composition"
        unCheckedChildren="Options"
      />
      <Button
        size="small"
        shape="round"
        type={playAnimation ? 'primary' : undefined}
        onClick={onTogglePlay}
        icon={playAnimation ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
      />
    </div>
  );
}
