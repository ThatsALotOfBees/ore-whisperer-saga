import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/hooks/useGameState';
import { FACTORY_MACHINE_MAP, FACTORY_MACHINES, getTileVein, type FactoryMachineDef, type VeinType } from '@/data/factory';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Activity, Trash2, ArrowUpCircle, RotateCw, Hammer, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ORE_MAP, ALL_ORES } from '@/data/ores';
import { CRAFTING_RECIPES } from '@/data/recipes';
import {
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu';

const GRID_SIZE = 32;
const TILE_SIZE = 80;

const VEIN_COLORS: Record<string, string> = {
  iron: '#94a3b8',
  copper: '#fb923c',
  stone: '#4b5563',
  coal: '#111827',
  gold: '#fbbf24',
  veinite: '#8b5cf6',
};

const VeinIndicator: React.FC<{ type: VeinType, richness: number }> = ({ type, richness }) => {
  if (!type) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
      <div 
        className="w-4 h-4 rounded-full blur-xl" 
        style={{ backgroundColor: VEIN_COLORS[type] }} 
      />
      <div 
        className="w-1.5 h-1.5 rounded-full" 
        style={{ backgroundColor: VEIN_COLORS[type], boxShadow: `0 0 8px ${VEIN_COLORS[type]}` }} 
      />
    </div>
  );
};

export const FactoryGrid: React.FC = () => {
  const { state, dispatch } = useGame();
  const [zoom, setZoom] = useState(1);
  const [assembleIndex, setAssembleIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  
  // Power stats
  const powerProduced = state.power?.produced || 0;
  const powerConsumed = state.power?.consumed || 0;
  const powerPercent = powerProduced > 0 ? (powerConsumed / powerProduced) * 100 : 0;
  const isPowerDeficit = powerConsumed > powerProduced;

  const handlePlace = (typeId: string) => {
    if (assembleIndex !== null) {
      dispatch({ type: 'PLACE_MACHINE', typeId, index: assembleIndex });
      setAssembleIndex(null);
    }
  };

  const handleRemove = (index: number) => {
    dispatch({ type: 'REMOVE_MACHINE', index });
  };

  const handleRotate = (index: number) => {
    dispatch({ type: 'ROTATE_MACHINE', index });
  };

  const handleUpgrade = (index: number) => {
    dispatch({ type: 'UPGRADE_MACHINE', index });
  };

  return (
    <div className="relative w-full h-[800px] bg-black/40 rounded-xl border border-white/10 overflow-hidden select-none">
      {/* HUD / Header */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-4 bg-black/60 backdrop-blur-md p-3 rounded-lg border border-white/10">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-white/50 mb-1">Grid System v0.8</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Zap className={cn("w-4 h-4", isPowerDeficit ? "text-destructive" : "text-primary")} />
              <span className="font-mono text-lg font-bold">
                {powerProduced} <span className="text-xs text-white/40">W</span>
              </span>
            </div>
            <div className="h-4 w-[1px] bg-white/10" />
            <div className="flex flex-col gap-1 w-32">
              <div className="flex justify-between text-[10px] font-mono">
                <span>LOAD</span>
                <span className={cn(isPowerDeficit && "text-destructive")}>{Math.round(powerPercent)}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className={cn("h-full", isPowerDeficit ? "bg-destructive" : "bg-primary")}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, powerPercent)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="h-10 w-[1px] bg-white/10 mx-2" />
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>-</Button>
          <span className="text-xs font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>+</Button>
        </div>
      </div>

      {/* Grid Canvas */}
      <div className="w-full h-full cursor-grab active:cursor-grabbing overflow-auto custom-scrollbar">
        <motion.div 
          className="relative bg-[#0a0a0c]"
          style={{ 
            width: GRID_SIZE * TILE_SIZE, 
            height: GRID_SIZE * TILE_SIZE,
            scale: zoom,
            transformOrigin: '0 0'
          }}
        >
          {/* Grid Background Pattern */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none" 
            style={{ 
              backgroundImage: `linear-gradient(to right, #444 1px, transparent 1px), linear-gradient(to bottom, #444 1px, transparent 1px)`,
              backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px`
            }} 
          />

          {/* Tiles */}
          <div 
            className="grid" 
            style={{ 
              gridTemplateColumns: `repeat(${GRID_SIZE}, ${TILE_SIZE}px)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, ${TILE_SIZE}px)`
            }}
          >
            {state.grid.map((tile, i) => (
              <ContextMenu key={i}>
                <ContextMenuTrigger>
                  <div 
                    className={cn(
                      "relative border-[0.5px] border-white/5 transition-all duration-200 group",
                      !tile && "hover:bg-primary/10 cursor-pointer",
                      tile && "bg-white/[0.02] hover:bg-white/[0.05]",
                      hoveredIndex === i && "border-primary/50 z-40 bg-primary/5"
                    )}
                    style={{ width: TILE_SIZE, height: TILE_SIZE }}
                    onMouseEnter={(e) => {
                      setHoveredIndex(i);
                    }}
                    onMouseMove={(e) => {
                      setCursorPos({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseLeave={() => {
                      setHoveredIndex(null);
                    }}
                  >
                    {!tile && <VeinIndicator {...getTileVein(i)} />}
                    
                    <AnimatePresence mode="wait">
                      {tile && (
                        <motion.div 
                          key={tile.id}
                          initial={{ scale: 0, opacity: 0, rotate: -45 }}
                          animate={{ scale: 1, opacity: 1, rotate: `${tile.rotation}deg` }}
                          exit={{ scale: 0, opacity: 0, rotate: 45 }}
                          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                          className="w-full h-full p-2 flex flex-col items-center justify-center relative overflow-hidden"
                        >
                          {/* Machine Visual */}
                          <motion.div 
                            className="text-3xl mb-1 relative z-10"
                            animate={tile.status === 'working' ? { 
                              scale: [1, 1.1, 1],
                              filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)']
                            } : {}}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            {FACTORY_MACHINE_MAP[tile.typeId]?.icon || '❓'}
                          </motion.div>
                          
                          {/* Status indicators */}
                          {tile.status === 'offline' && (
                            <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center z-20">
                              <Zap className="w-6 h-6 text-destructive animate-pulse" />
                            </div>
                          )}
                          
                          {tile.status === 'working' && (
                            <>
                              <div className="absolute inset-0 bg-primary/5 animate-pulse z-0" />
                              <motion.div 
                                animate={{ opacity: [0.3, 0.8, 0.3] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-primary z-30 shadow-[0_0_8px_hsl(var(--primary))]"
                              />
                            </>
                          )}

                          <div className="flex flex-col items-center mt-auto z-10 w-full px-1">
                            {tile.recipeId && (
                              <div className="text-[6px] uppercase text-white/40 mb-0.5 truncate w-full text-center">
                                {tile.recipeId.replace(/_/g, ' ')}
                              </div>
                            )}
                            <div className="flex gap-1 justify-center">
                              <Badge variant="outline" className="text-[7px] px-1 py-0 bg-black/60 border-white/10 text-white/70">
                                L{tile.level}
                              </Badge>
                              {FACTORY_MACHINE_MAP[tile.typeId]?.basePowerGen > 0 ? (
                                <Badge variant="outline" className="text-[7px] px-1 py-0 bg-primary/20 border-primary/20 text-primary">
                                  +{FACTORY_MACHINE_MAP[tile.typeId].tiers[tile.level-1].powerGen}W
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[7px] px-1 py-0 bg-destructive/20 border-destructive/20 text-destructive">
                                  -{FACTORY_MACHINE_MAP[tile.typeId].tiers[tile.level-1].powerDraw}W
                                </Badge>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!tile && (
                      <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                        <Hammer className="w-4 h-4 text-white/20" />
                      </div>
                    )}
                  </div>
                </ContextMenuTrigger>
                
                <ContextMenuContent className="w-56 bg-black/90 border-white/10 backdrop-blur-xl">
                  {!tile ? (
                    <ContextMenuItem onClick={() => setAssembleIndex(i)}>
                      <Hammer className="w-4 h-4 mr-2" />
                      <span>Assemble Machine</span>
                    </ContextMenuItem>
                  ) : (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-white/50 border-b border-white/10 mb-1">
                        {FACTORY_MACHINE_MAP[tile.typeId]?.name}
                      </div>
                      <ContextMenuItem onClick={() => handleUpgrade(i)} disabled={tile.level >= 26}>
                        <ArrowUpCircle className="w-4 h-4 mr-2 text-primary" />
                        <span>Upgrade (Lvl {tile.level + 1})</span>
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => handleRotate(i)}>
                        <RotateCw className="w-4 h-4 mr-2 text-white/50" />
                        <span>Rotate 90°</span>
                      </ContextMenuItem>

                      {FACTORY_MACHINE_MAP[tile.typeId]?.category === 'smelter' && (
                        <ContextMenuSub>
                          <ContextMenuSubTrigger>
                            <Settings2 className="w-4 h-4 mr-2 text-orange-400" />
                            <span>Select Ore to Smelt</span>
                          </ContextMenuSubTrigger>
                          <ContextMenuSubContent className="w-48 bg-black/90 border-white/10 backdrop-blur-xl max-h-80 overflow-y-auto">
                            {ALL_ORES.map(ore => (
                              <ContextMenuItem 
                                key={ore.id} 
                                onClick={() => dispatch({ type: 'SET_MACHINE_RECIPE', index: i, oreId: ore.id })}
                                className={tile.recipeId === ore.id ? "bg-primary/20" : ""}
                              >
                                {ore.name}
                              </ContextMenuItem>
                            ))}
                          </ContextMenuSubContent>
                        </ContextMenuSub>
                      )}

                      {FACTORY_MACHINE_MAP[tile.typeId]?.category === 'assembler' && (
                        <ContextMenuSub>
                          <ContextMenuSubTrigger>
                            <Settings2 className="w-4 h-4 mr-2 text-blue-400" />
                            <span>Select Recipe</span>
                          </ContextMenuSubTrigger>
                          <ContextMenuSubContent className="w-64 bg-black/90 border-white/10 backdrop-blur-xl max-h-80 overflow-y-auto">
                            {CRAFTING_RECIPES.map(recipe => (
                              <ContextMenuItem 
                                key={recipe.id} 
                                onClick={() => dispatch({ type: 'SET_MACHINE_RECIPE', index: i, recipeId: recipe.id })}
                                className={tile.recipeId === recipe.id ? "bg-primary/20" : ""}
                              >
                                {recipe.name}
                              </ContextMenuItem>
                            ))}
                          </ContextMenuSubContent>
                        </ContextMenuSub>
                      )}

                      <ContextMenuSeparator className="bg-white/10" />
                      <ContextMenuItem onClick={() => handleRemove(i)} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        <span>Disassemble</span>
                      </ContextMenuItem>
                    </>
                  )}
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
          
          {/* Floating Info Tooltip */}
          <AnimatePresence>
            {hoveredIndex !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                style={{
                  position: 'fixed',
                  left: cursorPos.x + 15,
                  top: cursorPos.y + 15,
                  zIndex: 100,
                  pointerEvents: 'none'
                }}
                className="bg-black/90 backdrop-blur-md border border-white/20 p-2 rounded shadow-2xl min-w-[120px]"
              >
                {state.grid[hoveredIndex] ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{FACTORY_MACHINE_MAP[state.grid[hoveredIndex]!.typeId]?.icon}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        {FACTORY_MACHINE_MAP[state.grid[hoveredIndex]!.typeId]?.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[8px] text-white/60">
                      <span>LEVEL</span>
                      <span className="text-white font-mono">{state.grid[hoveredIndex]!.level}</span>
                    </div>
                    <div className="flex items-center justify-between text-[8px] text-white/60">
                      <span>STATUS</span>
                      <span className={cn(
                        "font-mono uppercase",
                        state.grid[hoveredIndex]!.status === 'working' ? "text-primary" : "text-destructive"
                      )}>
                        {state.grid[hoveredIndex]!.status}
                      </span>
                    </div>
                    {state.grid[hoveredIndex]!.recipeId && (
                      <div className="pt-1 mt-1 border-t border-white/10 text-[7px] text-accent flex justify-between">
                        <span>TARGET:</span>
                        <span className="uppercase">{state.grid[hoveredIndex]!.recipeId.replace(/_/g, ' ')}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-[8px] uppercase tracking-widest text-white/40 mb-1">Empty Plot</div>
                    {getTileVein(hoveredIndex).type ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: VEIN_COLORS[getTileVein(hoveredIndex).type!] }} />
                        <span className="text-[9px] uppercase font-bold" style={{ color: VEIN_COLORS[getTileVein(hoveredIndex).type!] }}>
                          {getTileVein(hoveredIndex).type} NODE
                        </span>
                        <span className="text-[7px] text-white/30">({Math.round(getTileVein(hoveredIndex).richness * 100)}%)</span>
                      </div>
                    ) : (
                      <div className="text-[9px] text-white/20 italic">No resources detected</div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Assembly Dialog */}
      <Dialog open={assembleIndex !== null} onOpenChange={(open) => !open && setAssembleIndex(null)}>
        <DialogContent className="max-w-2xl bg-black/95 border-white/10 text-white backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Hammer className="text-primary w-6 h-6" />
              Construction Hub
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Select a facility to deploy on tile <span className="font-mono text-primary">#{assembleIndex}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {FACTORY_MACHINES.map(m => (
              <Card 
                key={m.id}
                className="group relative bg-white/5 border-white/10 hover:border-primary/50 transition-all cursor-pointer overflow-hidden"
                onClick={() => handlePlace(m.id)}
              >
                <div className="p-4 flex gap-4">
                  <div className="text-4xl bg-black/40 w-16 h-16 flex items-center justify-center rounded-lg border border-white/5">
                    {m.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{m.name}</h3>
                    <p className="text-xs text-white/40 leading-relaxed mt-1">{m.description}</p>
                    <div className="flex gap-2 mt-3">
                      {m.basePowerGen > 0 ? (
                        <Badge variant="outline" className="border-primary/20 text-primary text-[10px]">
                          +{m.basePowerGen}W GEN
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-destructive/20 text-destructive text-[10px]">
                          -{m.basePowerDraw}W DRAW
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
