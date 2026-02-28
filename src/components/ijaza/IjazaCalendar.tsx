import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, X, Clock, User, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CalendarSlot {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: "available" | "booked" | "blocked";
  notes: string | null;
  sheikh_name?: string;
  booked_by_name?: string;
  requester_name?: string;
  requester_email?: string;
  request_status?: string;
}

interface IjazaCalendarProps {
  isAdmin?: boolean;
  sheikhId?: string;
  onSlotSelect?: (slotId: string, date: string, time: string) => void;
  readOnly?: boolean;
}

const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

const STATUS_COLORS: Record<string, string> = {
  available: "bg-green-100 border-green-300 text-green-700 hover:bg-green-200 cursor-pointer",
  booked: "bg-rose-100 border-rose-300 text-rose-700",
  blocked: "bg-gray-100 border-gray-300 text-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  available: "Disponible",
  booked: "Réservé",
  blocked: "Bloqué",
};

export const IjazaCalendar: React.FC<IjazaCalendarProps> = ({
  isAdmin = false,
  sheikhId,
  onSlotSelect,
  readOnly = false,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newSlot, setNewSlot] = useState({ date: "", start: "09:00", end: "10:00", notes: "" });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const loadSlots = async () => {
    setLoading(true);
    try {
      const startDate = new Date(year, month, 1).toISOString().split("T")[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0];

      let query;
      if (isAdmin) {
        query = supabase
          .from("admin_calendar_view" as any)
          .select("*")
          .gte("booking_date", startDate)
          .lte("booking_date", endDate);
      } else {
        query = supabase
          .from("calendar_bookings" as any)
          .select("id, booking_date, start_time, end_time, status, notes")
          .eq("status", "available")
          .gte("booking_date", startDate)
          .lte("booking_date", endDate);
        if (sheikhId) query = query.eq("sheikh_id", sheikhId);
      }

      const { data, error } = await query.order("booking_date").order("start_time");
      if (error) throw error;
      setSlots((data as CalendarSlot[]) || []);
    } catch (e) {
      console.error("Calendar load error:", e);
    }
    setLoading(false);
  };

  useEffect(() => { loadSlots(); }, [year, month, isAdmin, sheikhId]);

  const getSlotsForDate = (dateStr: string) =>
    slots.filter(s => s.booking_date === dateStr);

  const handleAddSlot = async () => {
    if (!newSlot.date || !newSlot.start || !newSlot.end) {
      toast.error("Remplis tous les champs");
      return;
    }
    try {
      const { error } = await supabase
        .from("calendar_bookings" as any)
        .insert({
          sheikh_id: sheikhId || null,
          booking_date: newSlot.date,
          start_time: newSlot.start,
          end_time: newSlot.end,
          status: "available",
          notes: newSlot.notes || null,
        });
      if (error) {
        if (error.code === "23505") {
          toast.error("Un créneau existe déjà à ce moment !");
        } else throw error;
      } else {
        toast.success("Créneau ajouté !");
        setShowAddForm(false);
        setNewSlot({ date: "", start: "09:00", end: "10:00", notes: "" });
        loadSlots();
      }
    } catch (e) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("Supprimer ce créneau ?")) return;
    await supabase.from("calendar_bookings" as any).delete().eq("id", slotId);
    toast.success("Créneau supprimé");
    loadSlots();
  };

  const handleSelectSlot = (slot: CalendarSlot) => {
    if (slot.status !== "available" || readOnly) return;
    onSlotSelect?.(slot.id, slot.booking_date, slot.start_time);
  };

  // Build calendar grid
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="font-semibold text-lg">{MONTHS_FR[month]} {year}</h3>
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-1" />Ajouter créneau
          </Button>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-3 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200 border border-green-300" />Disponible</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-200 border border-rose-300" />Réservé</span>
        {isAdmin && <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 border border-gray-300" />Bloqué</span>}
      </div>

      {/* Add slot form */}
      {showAddForm && (
        <Card className="border-primary/40">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Nouveau créneau</CardTitle>
            <button onClick={() => setShowAddForm(false)}><X className="w-4 h-4" /></button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Date</label>
                <input type="date" value={newSlot.date} onChange={e => setNewSlot({...newSlot, date: e.target.value})}
                  min={today} className="w-full border rounded px-2 py-1 text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Début</label>
                <input type="time" value={newSlot.start} onChange={e => setNewSlot({...newSlot, start: e.target.value})}
                  className="w-full border rounded px-2 py-1 text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Fin</label>
                <input type="time" value={newSlot.end} onChange={e => setNewSlot({...newSlot, end: e.target.value})}
                  className="w-full border rounded px-2 py-1 text-sm mt-1" />
              </div>
            </div>
            <input type="text" placeholder="Notes (optionnel)" value={newSlot.notes}
              onChange={e => setNewSlot({...newSlot, notes: e.target.value})}
              className="w-full border rounded px-2 py-1 text-sm" />
            <Button size="sm" className="w-full" onClick={handleAddSlot}>Ajouter</Button>
          </CardContent>
        </Card>
      )}

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_FR.map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>
          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={"empty-" + idx} />;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const daySlots = getSlotsForDate(dateStr);
              const isToday = dateStr === today;
              const isPast = dateStr < today;
              return (
                <div
                  key={dateStr}
                  className={"min-h-16 rounded-lg border p-1 " + (isToday ? "border-primary bg-primary/5" : "border-border") + (isPast ? " opacity-50" : "")}
                >
                  <p className={"text-xs font-medium mb-1 " + (isToday ? "text-primary" : "text-foreground")}>{day}</p>
                  <div className="space-y-0.5">
                    {daySlots.map(slot => (
                      <div
                        key={slot.id}
                        onClick={() => handleSelectSlot(slot)}
                        className={"text-xs px-1 py-0.5 rounded border " + STATUS_COLORS[slot.status]}
                        title={STATUS_LABELS[slot.status] + (slot.booked_by_name ? " — " + slot.booked_by_name : "")}
                      >
                        <span className="font-medium">{slot.start_time.substring(0, 5)}</span>
                        {isAdmin && slot.status === "booked" && (
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteSlot(slot.id); }}
                            className="ml-1 text-rose-500 hover:text-rose-700 float-right">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                        {isAdmin && slot.status === "available" && (
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteSlot(slot.id); }}
                            className="ml-1 text-muted-foreground hover:text-rose-500 float-right">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected date slots detail (user view) */}
      {!isAdmin && slots.filter(s => s.status === "available").length === 0 && !loading && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucun créneau disponible ce mois — contactez-nous pour en discuter.
        </p>
      )}
    </div>
  );
};

export default IjazaCalendar;
