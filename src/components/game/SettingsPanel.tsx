import { useGame } from '@/hooks/useGameState';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Settings2 } from 'lucide-react';

export const SettingsPanel = () => {
  const { state, dispatch } = useGame();

  const handleToggleBackground = (checked: boolean) => {
    dispatch({ type: 'UPDATE_SETTINGS', settings: { showBackground: checked } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings2 className="w-5 h-5 text-primary" />
        <h2 className="font-mono-game text-sm font-bold tracking-[0.15em] uppercase text-primary">System Settings</h2>
      </div>

      <div className="grid gap-6">
        <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="space-y-1">
            <Label htmlFor="bg-toggle" className="font-mono-game text-xs text-foreground uppercase tracking-wider">
              Animated Background
            </Label>
            <p className="text-[10px] text-muted-foreground uppercase font-mono-game tracking-tighter">
              Toggle the Three.js LightPillar effect
            </p>
          </div>
          <Switch 
            id="bg-toggle" 
            checked={state.settings?.showBackground ?? true}
            onCheckedChange={handleToggleBackground}
          />
        </div>

        <Separator className="bg-white/5" />
        
        <div className="p-4 rounded-lg bg-white/5 border border-white/10 opacity-50 cursor-not-allowed">
          <div className="space-y-1">
            <Label className="font-mono-game text-xs text-foreground uppercase tracking-wider">
              Master Volume
            </Label>
            <p className="text-[10px] text-muted-foreground uppercase font-mono-game tracking-tighter">
              Coming Soon
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/5">
        <p className="font-mono-game text-[9px] text-muted-foreground/40 text-center uppercase leading-relaxed">
          Operational Terminal v0.691<br />
          Void Market Systems Integrity: Stable
        </p>
      </div>
    </div>
  );
};
