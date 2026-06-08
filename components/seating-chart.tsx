"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { weddingService } from "@/lib/data-service";
import type { Guest, SeatingTable, SeatingAssignment } from "@/types";
import { Plus, Trash2, Download, Users, Edit2 } from "lucide-react";
import { toast } from "sonner";

interface SeatingChartProps {
  weddingId: string;
  guests: Guest[];
  onUpdate?: () => void;
}

export function SeatingChart({ weddingId, guests, onUpdate }: SeatingChartProps) {
  const [tables, setTables] = useState<SeatingTable[]>([]);
  const [assignments, setAssignments] = useState<SeatingAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const floorplanRef = useRef<HTMLDivElement>(null);

  // Ref to always have latest tables for drag calculations (avoids stale closures during drag)
  const tablesRef = useRef<SeatingTable[]>(tables);
  useEffect(() => {
    tablesRef.current = tables;
  }, [tables]);

  const assignedGuestIds = new Set(assignments.map(a => a.guestId));
  const unassignedGuests = guests.filter(g => !assignedGuestIds.has(g.id));

  useEffect(() => {
    loadSeating();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weddingId]);

  async function loadSeating() {
    setLoading(true);
    try {
      const [t, a] = await Promise.all([
        weddingService.getTablesForWedding(weddingId),
        weddingService.getAssignmentsForWedding(weddingId),
      ]);
      setTables(t);
      setAssignments(a);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load seating data");
    } finally {
      setLoading(false);
    }
  }

  async function addTable(shape: 'round' | 'rect') {
    const currentCount = tablesRef.current.length;
    const name = `${shape === 'round' ? 'Round' : 'Rectangular'} Table ${currentCount + 1}`;
    const capacity = shape === 'round' ? 8 : 10;
    try {
      const newTable = await weddingService.addTable(weddingId, {
        name,
        shape,
        capacity,
        x: 20 + (currentCount % 3) * 25,
        y: 20 + Math.floor(currentCount / 3) * 30,
      });
      setTables(prev => [...prev, newTable]);
      toast.success(`Added ${name}`);
      onUpdate?.();
    } catch (e) {
      toast.error("Failed to add table");
    }
  }

  async function updateTablePosition(tableId: string, x: number, y: number) {
    try {
      await weddingService.updateTable(tableId, { x, y });
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, x, y } : t));
      onUpdate?.();
    } catch (e) {
      toast.error("Failed to move table");
    }
  }

  async function deleteTable(tableId: string) {
    if (!confirm("Delete this table and unassign its guests?")) return;
    try {
      await weddingService.deleteTable(tableId);
      setTables(prev => prev.filter(t => t.id !== tableId));
      setAssignments(prev => prev.filter(a => a.tableId !== tableId));
      toast.success("Table removed");
      onUpdate?.();
    } catch (e) {
      toast.error("Failed to delete table");
    }
  }

  async function renameTable(tableId: string, currentName: string) {
    const newName = prompt("Enter new table name:", currentName || "Table");
    if (!newName || newName.trim() === "" || newName === currentName) return;
    try {
      await weddingService.updateTable(tableId, { name: newName.trim() });
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, name: newName.trim() } : t));
      toast.success("Table renamed");
      onUpdate?.();
    } catch (e) {
      toast.error("Failed to rename table");
    }
  }

  async function assignGuest(guestId: string, tableId: string) {
    try {
      await weddingService.assignGuestToTable(guestId, tableId);
      // reload to get fresh
      const freshAssignments = await weddingService.getAssignmentsForWedding(weddingId);
      setAssignments(freshAssignments);
      toast.success("Guest assigned to table");
      onUpdate?.();
    } catch (e) {
      toast.error("Failed to assign guest");
    }
  }

  async function unassignGuest(guestId: string) {
    try {
      await weddingService.unassignGuest(guestId);
      const fresh = await weddingService.getAssignmentsForWedding(weddingId);
      setAssignments(fresh);
      toast.info("Guest unassigned");
      onUpdate?.();
    } catch (e) {
      toast.error("Failed to unassign");
    }
  }

  function getGuestsForTable(tableId: string) {
    const ids = assignments.filter(a => a.tableId === tableId).map(a => a.guestId);
    return guests.filter(g => ids.includes(g.id));
  }

  // Simple HTML5 drag for guests from sidebar to tables
  function handleGuestDragStart(e: React.DragEvent, guestId: string) {
    e.dataTransfer.setData("text/plain", guestId);
  }

  function handleTableDrop(e: React.DragEvent, tableId: string) {
    e.preventDefault();
    const guestId = e.dataTransfer.getData("text/plain");
    if (guestId) {
      assignGuest(guestId, tableId);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  // Export using html2canvas + jspdf
  async function exportPNG() {
    if (!floorplanRef.current) return;
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(floorplanRef.current, { scale: 2 });
    const link = document.createElement("a");
    link.download = `seating-chart-${weddingId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Exported PNG");
  }

  async function exportPDF() {
    if (!floorplanRef.current) return;
    const { default: html2canvas } = await import("html2canvas");
    const { jsPDF } = await import("jspdf");
    const canvas = await html2canvas(floorplanRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [canvas.width, canvas.height],
    });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save(`seating-chart-${weddingId}.pdf`);
    toast.success("Exported PDF");
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading seating chart...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-2xl tracking-tight">Seating Chart</h3>
          <p className="text-sm text-muted-foreground">Drag tables to arrange • Drag guests from the list to tables</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => addTable('round')}>
            <Plus className="mr-1.5 h-4 w-4" /> Round Table
          </Button>
          <Button variant="outline" size="sm" onClick={() => addTable('rect')}>
            <Plus className="mr-1.5 h-4 w-4" /> Rectangular Table
          </Button>
          <Button variant="outline" size="sm" onClick={exportPNG}>
            <Download className="mr-1.5 h-4 w-4" /> PNG
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <Download className="mr-1.5 h-4 w-4" /> PDF
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={async () => {
              // Deep integration: mark the seating checklist item complete for premium feel
              const items = await weddingService.getChecklistForWedding(weddingId);
              const seatingItem = items.find(i => i.label.toLowerCase().includes("seating chart"));
              if (seatingItem && !seatingItem.completed) {
                await weddingService.toggleChecklistItem(seatingItem.id, true);
                toast.success("Seating marked complete in your 12-month planner");
                onUpdate?.();
              } else {
                toast.info("Seating already tracked in planner or item not found.");
              }
            }}
          >
            ✓ Mark complete in planner
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Unassigned Guests Sidebar */}
        <div className="lg:col-span-1">
          <div className="font-medium text-sm mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" /> Unassigned Guests ({unassignedGuests.length})
          </div>
          <div className="border rounded-lg p-3 max-h-[420px] overflow-auto space-y-1 bg-muted/30">
            {unassignedGuests.length === 0 ? (
              <div className="text-xs text-muted-foreground p-4 text-center">All guests seated. Great job!</div>
            ) : (
              unassignedGuests.map(guest => (
                <div
                  key={guest.id}
                  draggable
                  onDragStart={(e) => handleGuestDragStart(e, guest.id)}
                  className="flex items-center justify-between text-sm p-2 bg-background rounded border cursor-grab active:cursor-grabbing hover:border-champagne transition"
                >
                  <span>{guest.fullName}</span>
                  {guest.plusOne && <span className="text-[10px] text-muted-foreground">+1</span>}
                </div>
              ))
            )}
          </div>
          <div className="text-[10px] text-muted-foreground mt-2">Drag a name onto a table to seat them.</div>
        </div>

        {/* Floorplan */}
        <div className="lg:col-span-3">
          <div className="text-sm font-medium mb-2 text-muted-foreground tracking-widest">RECEPTION FLOOR PLAN</div>
          <div
            ref={floorplanRef}
            className="relative border-2 border-dashed border-champagne/30 rounded-2xl bg-[radial-gradient(#e8e0d5_0.8px,transparent_1px)] bg-[length:18px_18px] overflow-hidden"
            style={{ height: 420, backgroundColor: 'hsl(var(--background))' }}
          >
            {tables.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                Add tables above to begin arranging your seating chart.
              </div>
            )}

            {tables.map((table) => {
              const assigned = getGuestsForTable(table.id);
              const isRound = table.shape === 'round';
              return (
                <motion.div
                  key={table.id}
                  drag
                  dragConstraints={floorplanRef}
                  dragElastic={0}
                  dragMomentum={false}
                  onDragEnd={(_event, info) => {
                    const container = floorplanRef.current;
                    if (!container) return;
                    const rect = container.getBoundingClientRect();
                    if (rect.width === 0 || rect.height === 0) return;

                    // Use latest from ref to avoid any stale closure
                    const currentTable = tablesRef.current.find(t => t.id === table.id) || table;
                    const currentX = currentTable.x;
                    const currentY = currentTable.y;

                    const deltaXPercent = (info.offset.x / rect.width) * 100;
                    const deltaYPercent = (info.offset.y / rect.height) * 100;

                    // Compute this table's approximate size in % so it doesn't go off the edge
                    const tableW = isRound ? 110 : 130;
                    const tableH = isRound ? 110 : 80;
                    const wPercent = (tableW / rect.width) * 100;
                    const hPercent = (tableH / rect.height) * 100;

                    const newX = Math.max(0, Math.min(100 - wPercent, currentX + deltaXPercent));
                    const newY = Math.max(0, Math.min(100 - hPercent, currentY + deltaYPercent));

                    updateTablePosition(table.id, newX, newY);
                  }}
                  className={`absolute flex flex-col items-center justify-center border shadow-md cursor-move select-none ${isRound ? 'rounded-full' : 'rounded-lg'}`}
                  style={{
                    left: `${table.x}%`,
                    top: `${table.y}%`,
                    width: isRound ? 110 : 130,
                    height: isRound ? 110 : 80,
                    background: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--champagne) / 0.4)',
                    transform: table.rotation ? `rotate(${table.rotation}deg)` : undefined,
                  }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleTableDrop(e, table.id)}
                >
                  <div 
                    className="text-xs font-medium text-center px-1 truncate w-full cursor-pointer hover:underline" 
                    title="Click to rename"
                    onClick={(e) => { e.stopPropagation(); renameTable(table.id, table.name); }}
                  >
                    {table.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {assigned.length}/{table.capacity}
                  </div>

                  {/* Assigned guests chips */}
                  <div className="mt-1 flex flex-wrap gap-0.5 justify-center max-w-[90%]">
                    {assigned.slice(0, 4).map(g => (
                      <span
                        key={g.id}
                        className="text-[9px] bg-champagne/10 text-champagne px-1.5 py-0 rounded"
                        title={g.fullName}
                      >
                        {g.fullName.split(" ")[0]}
                      </span>
                    ))}
                    {assigned.length > 4 && <span className="text-[9px]">+{assigned.length - 4}</span>}
                  </div>

                  {/* Visual seat indicators (premium touch) */}
                  <div className="absolute -bottom-3 flex gap-px opacity-60">
                    {Array.from({ length: Math.min(table.capacity, 8) }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-1.5 w-1.5 rounded-full border ${i < assigned.length ? 'bg-champagne border-champagne' : 'border-champagne/40 bg-transparent'}`} 
                      />
                    ))}
                  </div>

                  {/* Controls */}
                  <div className="absolute -top-2 -right-2 flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); renameTable(table.id, table.name); }}
                      className="h-5 w-5 rounded-full bg-champagne text-white flex items-center justify-center opacity-70 hover:opacity-100"
                      title="Rename table"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => deleteTable(table.id)}
                      className="h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-70 hover:opacity-100"
                      title="Delete table"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Unassign buttons for assigned */}
                  {assigned.length > 0 && (
                    <div className="absolute -bottom-1 right-1 flex gap-px">
                      {assigned.slice(0, 2).map(g => (
                        <button
                          key={g.id}
                          onClick={() => unassignGuest(g.id)}
                          className="text-[8px] bg-background border px-1 rounded opacity-60 hover:opacity-100"
                        >
                          ×
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
          <div className="text-[10px] text-muted-foreground mt-2">Drag tables to reposition • Drop guests from the left list onto tables</div>
        </div>
      </div>

      {/* Legend / help */}
      <div className="text-xs text-muted-foreground">
        Tables are saved automatically. Guests can be reassigned anytime. Export a beautiful floor plan for your venue coordinator.
      </div>
    </div>
  );
}
