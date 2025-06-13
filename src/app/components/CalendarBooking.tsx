'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Setup the localizer for react-big-calendar
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface TimeSlot {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'available' | 'booked' | 'blocked';
  tokenId?: string;
  bookedBy?: string;
  service?: string;
  hourlyRate?: number;
}

interface CalendarBookingProps {
  tokenId?: string;
  creatorMode?: boolean; // If true, creator can manage availability. If false, buyer can book slots
  onSlotBooked?: (slot: TimeSlot) => void;
  onSlotCreated?: (slot: TimeSlot) => void;
  onClose?: () => void;
}

export default function CalendarBooking({ 
  tokenId, 
  creatorMode = false, 
  onSlotBooked, 
  onSlotCreated,
  onClose 
}: CalendarBookingProps) {
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [newSlotData, setNewSlotData] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    type: 'available' as 'available' | 'blocked'
  });

  useEffect(() => {
    loadTimeSlots();
  }, [tokenId]);

  const loadTimeSlots = () => {
    // Simulate loading time slots - in production, load from localStorage or API
    const sampleSlots: TimeSlot[] = [
      {
        id: '1',
        title: 'Available for Web Development',
        start: new Date(2024, 11, 16, 9, 0), // December 16, 2024, 9:00 AM
        end: new Date(2024, 11, 16, 11, 0),   // December 16, 2024, 11:00 AM
        type: 'available',
        tokenId: tokenId,
        service: 'Web Development Consultation',
        hourlyRate: 150
      },
      {
        id: '2',
        title: 'Booked: UI/UX Design Review',
        start: new Date(2024, 11, 17, 14, 0), // December 17, 2024, 2:00 PM
        end: new Date(2024, 11, 17, 16, 0),   // December 17, 2024, 4:00 PM
        type: 'booked',
        tokenId: tokenId,
        bookedBy: '0x1234...5678',
        service: 'UI/UX Design Review',
        hourlyRate: 150
      },
      {
        id: '3',
        title: 'Blocked - Personal Time',
        start: new Date(2024, 11, 18, 12, 0), // December 18, 2024, 12:00 PM
        end: new Date(2024, 11, 18, 13, 0),   // December 18, 2024, 1:00 PM
        type: 'blocked'
      }
    ];

    setTimeSlots(sampleSlots);
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    if (!creatorMode) return; // Only creators can create new slots

    setNewSlotData({
      title: '',
      date: format(start, 'yyyy-MM-dd'),
      startTime: format(start, 'HH:mm'),
      endTime: format(end, 'HH:mm'),
      type: 'available'
    });
    setShowSlotModal(true);
  };

  const handleSelectEvent = (event: TimeSlot) => {
    setSelectedSlot(event);
  };

  const handleCreateSlot = () => {
    const startDateTime = new Date(`${newSlotData.date}T${newSlotData.startTime}`);
    const endDateTime = new Date(`${newSlotData.date}T${newSlotData.endTime}`);

    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      title: newSlotData.title || `${newSlotData.type === 'available' ? 'Available' : 'Blocked'} Time`,
      start: startDateTime,
      end: endDateTime,
      type: newSlotData.type,
      tokenId: tokenId,
      service: newSlotData.type === 'available' ? newSlotData.title : undefined,
      hourlyRate: newSlotData.type === 'available' ? 150 : undefined // Default rate
    };

    setTimeSlots(prev => [...prev, newSlot]);
    setShowSlotModal(false);
    setNewSlotData({
      title: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '10:00',
      type: 'available'
    });

    if (onSlotCreated) {
      onSlotCreated(newSlot);
    }
  };

  const handleBookSlot = (slot: TimeSlot) => {
    if (creatorMode || slot.type !== 'available') return;

    // Update slot to booked
    const updatedSlot: TimeSlot = {
      ...slot,
      type: 'booked',
      title: `Booked: ${slot.service}`,
      bookedBy: '0x1234...5678' // Current user address
    };

    setTimeSlots(prev => prev.map(s => s.id === slot.id ? updatedSlot : s));
    setSelectedSlot(null);

    if (onSlotBooked) {
      onSlotBooked(updatedSlot);
    }
  };

  const handleDeleteSlot = (slotId: string) => {
    if (!creatorMode) return;
    
    setTimeSlots(prev => prev.filter(s => s.id !== slotId));
    setSelectedSlot(null);
  };

  const eventStyleGetter = (event: TimeSlot) => {
    let backgroundColor = '#3174ad';
    let borderColor = '#3174ad';
    let color = 'white';

    switch (event.type) {
      case 'available':
        backgroundColor = '#10b981'; // green
        borderColor = '#10b981';
        break;
      case 'booked':
        backgroundColor = '#f59e0b'; // yellow
        borderColor = '#f59e0b';
        break;
      case 'blocked':
        backgroundColor = '#ef4444'; // red
        borderColor = '#ef4444';
        break;
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color,
        border: 'none',
        borderRadius: '8px',
        fontSize: '12px',
        padding: '2px 6px'
      }
    };
  };

  const formatSlotTime = (start: Date, end: Date) => {
    return `${format(start, 'MMM d, h:mm a')} - ${format(end, 'h:mm a')}`;
  };

  const calculateSlotDuration = (start: Date, end: Date) => {
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours;
  };

  const calculateSlotCost = (slot: TimeSlot) => {
    if (!slot.hourlyRate) return 0;
    const duration = calculateSlotDuration(slot.start, slot.end);
    return duration * slot.hourlyRate;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-blue-500 to-purple-600 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              📅 {creatorMode ? 'Manage Availability' : 'Book Time Slots'}
            </h1>
            <p className="text-white/80 text-xl">
              {creatorMode 
                ? 'Set your available hours and manage bookings' 
                : 'Select and book available time slots for services'
              }
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-medium transition-all border border-white/30"
            >
              ← Back
            </button>
          )}
        </div>

        {/* Calendar Toolbar */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-6 border border-white/20">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex gap-2">
              {[Views.MONTH, Views.WEEK, Views.DAY].map(viewName => (
                <button
                  key={viewName}
                  onClick={() => setView(viewName)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    view === viewName
                      ? 'bg-white text-purple-600'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {viewName.charAt(0).toUpperCase() + viewName.slice(1)}
                </button>
              ))}
            </div>
            
            <div className="text-white font-medium">
              {format(date, 'MMMM yyyy')}
            </div>

            <div className="flex gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-white/80">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-white/80">Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-white/80">Blocked</span>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 mb-6">
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={timeSlots}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              selectable={creatorMode}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              style={{
                height: '100%',
                color: 'white'
              }}
              formats={{
                timeGutterFormat: 'h:mm A',
                agendaTimeFormat: 'h:mm A',
                dayHeaderFormat: 'dddd, MMM Do',
                dayRangeHeaderFormat: ({ start, end }) => 
                  `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
              }}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-white font-bold text-lg mb-4">
            {creatorMode ? '🛠️ Creator Instructions' : '📋 Booking Instructions'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white/80">
            {creatorMode ? (
              <>
                <div>• Click and drag on empty calendar space to create new availability slots</div>
                <div>• Click on existing slots to edit or delete them</div>
                <div>• Green slots are available for booking by clients</div>
                <div>• Red slots are blocked time (personal, meetings, etc.)</div>
              </>
            ) : (
              <>
                <div>• Green slots are available for booking</div>
                <div>• Yellow slots are already booked</div>
                <div>• Click on available slots to book them</div>
                <div>• Payment will be processed through your connected wallet</div>
              </>
            )}
          </div>
        </div>

        {/* Create Slot Modal */}
        <AnimatePresence>
          {showSlotModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowSlotModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full border border-white/20"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-white mb-6">Create Time Slot</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/80 font-medium mb-2">Title/Service</label>
                    <input
                      type="text"
                      value={newSlotData.title}
                      onChange={(e) => setNewSlotData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                      placeholder="e.g., Web Development Consultation"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 font-medium mb-2">Date</label>
                    <input
                      type="date"
                      value={newSlotData.date}
                      onChange={(e) => setNewSlotData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/80 font-medium mb-2">Start Time</label>
                      <input
                        type="time"
                        value={newSlotData.startTime}
                        onChange={(e) => setNewSlotData(prev => ({ ...prev, startTime: e.target.value }))}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/50"
                      />
                    </div>
                    <div>
                      <label className="block text-white/80 font-medium mb-2">End Time</label>
                      <input
                        type="time"
                        value={newSlotData.endTime}
                        onChange={(e) => setNewSlotData(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/80 font-medium mb-2">Type</label>
                    <select
                      value={newSlotData.type}
                      onChange={(e) => setNewSlotData(prev => ({ ...prev, type: e.target.value as 'available' | 'blocked' }))}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/50"
                    >
                      <option value="available">Available for Booking</option>
                      <option value="blocked">Blocked Time</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setShowSlotModal(false)}
                    className="flex-1 bg-white/20 hover:bg-white/30 text-white py-3 px-6 rounded-xl font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateSlot}
                    className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-3 px-6 rounded-xl font-medium transition-all"
                  >
                    Create Slot
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Slot Details Modal */}
        <AnimatePresence>
          {selectedSlot && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedSlot(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full border border-white/20"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-white mb-4">{selectedSlot.title}</h2>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <span className="text-white/60">Time:</span>
                    <div className="text-white font-medium">
                      {formatSlotTime(selectedSlot.start, selectedSlot.end)}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-white/60">Duration:</span>
                    <div className="text-white font-medium">
                      {calculateSlotDuration(selectedSlot.start, selectedSlot.end)} hours
                    </div>
                  </div>

                  <div>
                    <span className="text-white/60">Status:</span>
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ml-2 ${
                      selectedSlot.type === 'available' ? 'text-green-400 bg-green-500/20' :
                      selectedSlot.type === 'booked' ? 'text-yellow-400 bg-yellow-500/20' :
                      'text-red-400 bg-red-500/20'
                    }`}>
                      {selectedSlot.type.charAt(0).toUpperCase() + selectedSlot.type.slice(1)}
                    </div>
                  </div>

                  {selectedSlot.hourlyRate && (
                    <div>
                      <span className="text-white/60">Cost:</span>
                      <div className="text-white font-medium">
                        ${calculateSlotCost(selectedSlot).toFixed(2)} 
                        <span className="text-white/60 text-sm ml-1">
                          (${selectedSlot.hourlyRate}/hour)
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedSlot.bookedBy && (
                    <div>
                      <span className="text-white/60">Booked by:</span>
                      <div className="text-white font-medium">
                        {selectedSlot.bookedBy}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedSlot(null)}
                    className="flex-1 bg-white/20 hover:bg-white/30 text-white py-3 px-6 rounded-xl font-medium transition-all"
                  >
                    Close
                  </button>
                  
                  {/* Creator actions */}
                  {creatorMode && (
                    <button
                      onClick={() => handleDeleteSlot(selectedSlot.id)}
                      className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-3 px-6 rounded-xl font-medium transition-all"
                    >
                      Delete Slot
                    </button>
                  )}
                  
                  {/* Buyer actions */}
                  {!creatorMode && selectedSlot.type === 'available' && (
                    <button
                      onClick={() => handleBookSlot(selectedSlot)}
                      className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-3 px-6 rounded-xl font-medium transition-all"
                    >
                      Book Slot
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}