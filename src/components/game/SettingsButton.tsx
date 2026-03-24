import { Settings2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SettingsPanel } from './SettingsPanel';

export function SettingsButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="fixed bottom-4 left-[95px] sm:left-[110px] z-50 flex h-[38px] w-[38px] items-center justify-center rounded border border-border bg-card text-muted-foreground shadow-lg transition-colors hover:border-primary/50 hover:text-primary"
          aria-label="Open Settings"
        >
          <Settings2 size={18} />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-xl border-white/10 text-foreground">
        <DialogHeader className="mb-4">
          <DialogTitle className="font-mono-game text-sm uppercase tracking-[0.2em] text-primary">System Interface</DialogTitle>
        </DialogHeader>
        <SettingsPanel />
      </DialogContent>
    </Dialog>
  );
}
