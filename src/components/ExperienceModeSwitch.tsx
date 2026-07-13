interface ExperienceModeSwitchProps {
  activeMode: '2d' | '3d';
}

export function ExperienceModeSwitch({ activeMode }: ExperienceModeSwitchProps) {
  return (
    <nav className="mode-switch" aria-label="Experience mode">
      <a href="/" aria-current={activeMode === '2d' ? 'page' : undefined}>2D</a>
      <a href="/3d" aria-current={activeMode === '3d' ? 'page' : undefined}>3D</a>
    </nav>
  );
}
