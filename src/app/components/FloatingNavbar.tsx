// src/app/components/FloatingNavbar.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export default function FloatingNavbar() {
  const { thoughts, removeThought, toggleTaskComplete } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<'tasks' | 'thoughts' | null>(null);
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', text: 'Complete project proposal', completed: false, createdAt: new Date().toISOString() },
    { id: '2', text: 'Review team feedback', completed: false, createdAt: new Date().toISOString() },
    { id: '3', text: 'Schedule client meeting', completed: true, createdAt: new Date().toISOString() },
  ]);
  const [newTask, setNewTask] = useState('');
  const [processingThoughts, setProcessingThoughts] = useState<Set<string>>(new Set());

  const addTask = () => {
    if (!newTask.trim()) return;
    
    const task: Task = {
      id: Date.now().toString(),
      text: newTask.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    
    setTasks([task, ...tasks]);
    setNewTask('');
  };

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const reorderTasks = (startIndex: number, endIndex: number) => {
    const result = Array.from(tasks);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setTasks(result);
  };

  const handleToggleComplete = async (thought: { _id?: string; id?: string; }) => {
    if (!thought._id || processingThoughts.has(thought._id)) return;
    
    setProcessingThoughts(prev => new Set(prev).add(thought._id!));
    
    try {
      await toggleTaskComplete(thought._id);
    } catch (error) {
      console.error('Failed to toggle thought completion:', error);
    } finally {
      setProcessingThoughts(prev => {
        const newSet = new Set(prev);
        newSet.delete(thought._id!);
        return newSet;
      });
    }
  };

  const handleDeleteThought = async (thought: { _id?: string; id?: string; text?: string; }) => {
    if (!thought._id || processingThoughts.has(thought._id)) {
      console.warn('Cannot delete thought from navbar - invalid ID or already processing:', { id: thought._id, thought });
      return;
    }
    
    console.log('Deleting thought from navbar:', { id: thought._id, text: thought.text });
    
    setProcessingThoughts(prev => new Set(prev).add(thought._id!));
    
    try {
      await removeThought(thought._id);
      console.log('Thought deleted successfully from navbar');
    } catch (error) {
      console.error('Failed to delete thought from navbar:', error);
    } finally {
      setProcessingThoughts(prev => {
        const newSet = new Set(prev);
        newSet.delete(thought._id!);
        return newSet;
      });
    }
  };

  const openPanel = (panel: 'tasks' | 'thoughts') => {
    // Immediately set both states to reduce delays
    setActivePanel(panel);
    setIsOpen(true);
  };

  const closePanel = () => {
    setIsOpen(false);
    // Reduce delay for better responsiveness
    setTimeout(() => setActivePanel(null), 100);
  };

  return (
    <>
      {/* Floating Navbar */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-40 px-4 w-full max-w-sm sm:max-w-none sm:w-auto"
      >
        <div className="bg-black/20 backdrop-blur-lg rounded-full px-4 sm:px-6 py-2 sm:py-3 border border-white/20 shadow-lg">
          <div className="flex items-center gap-2 sm:gap-4 justify-center">
            {/* Task Manager Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openPanel('tasks')}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors duration-75 text-xs sm:text-sm"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span className="font-medium hidden xs:inline sm:hidden">T</span>
              <span className="font-medium hidden sm:inline">Tasks</span>
              {tasks.filter(t => !t.completed).length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs">
                  {tasks.filter(t => !t.completed).length}
                </span>
              )}
            </motion.button>

            {/* Divider */}
            <div className="w-px h-4 sm:h-6 bg-white/20"></div>

            {/* Captured Thoughts Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openPanel('thoughts')}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors duration-75 text-xs sm:text-sm"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="font-medium hidden xs:inline sm:hidden">Th</span>
              <span className="font-medium hidden sm:inline">Thoughts</span>
              {thoughts.length > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs">
                  {thoughts.length}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Overlay Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={closePanel}
          >
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute bottom-16 sm:bottom-20 left-1/2 transform -translate-x-1/2 w-[90vw] max-w-md sm:max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl overflow-hidden max-h-[70vh] flex flex-col">
                {/* Panel Header */}
                <div className="p-3 sm:p-4 border-b border-white/10 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-semibold text-white">
                      {activePanel === 'tasks' ? 'Task Manager' : 'Captured Thoughts'}
                    </h3>
                    <button
                      onClick={closePanel}
                      className="text-white/60 hover:text-white transition-colors duration-75 active:scale-95 p-1"
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Panel Content */}
                <div className="p-3 sm:p-4 overflow-y-auto scrollbar-custom flex-1">
                  <style jsx>{`
                    .scrollbar-custom::-webkit-scrollbar {
                      width: 12px;
                    }
                    .scrollbar-custom::-webkit-scrollbar-track {
                      background: rgba(255, 255, 255, 0.1);
                      border-radius: 6px;
                    }
                    .scrollbar-custom::-webkit-scrollbar-thumb {
                      background: rgba(255, 255, 255, 0.3);
                      border-radius: 6px;
                      border: 2px solid transparent;
                      background-clip: content-box;
                    }
                    .scrollbar-custom::-webkit-scrollbar-thumb:hover {
                      background: rgba(255, 255, 255, 0.5);
                      background-clip: content-box;
                    }
                  `}</style>
                  {activePanel === 'tasks' && (
                    <div className="space-y-3 sm:space-y-4">
                      {/* Add Task Form */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTask}
                          onChange={(e) => setNewTask(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addTask()}
                          placeholder="Add a new task..."
                          className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
                        />
                        <button
                          onClick={addTask}
                          className="px-3 sm:px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-100 active:bg-white/40 text-sm font-medium"
                        >
                          Add
                        </button>
                      </div>

                      {tasks.length > 1 && (
                        <p className="text-xs text-white/50 text-center">✨ Smoothly drag tasks up/down to reorder them</p>
                      )}

                      {/* Tasks List */}
                      <div className="space-y-2">
                        {tasks.length === 0 ? (
                          <p className="text-white/60 text-center py-6 text-sm">No tasks yet. Add one above!</p>
                        ) : (
                          tasks.map((task, index) => (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ 
                                opacity: 1, 
                                x: 0,
                                scale: 1, 
                                rotate: 0,
                                transition: { type: "spring", stiffness: 300, damping: 25 }
                              }}
                              exit={{ opacity: 0, x: 20 }}
                              drag="y"
                              dragConstraints={{ top: 0, bottom: 0 }}
                              dragElastic={0.2}
                              dragMomentum={false}
                              dragTransition={{ bounceStiffness: 300, bounceDamping: 40 }}
                              onDragStart={() => {
                                // Add haptic feedback if supported
                                if (navigator.vibrate) navigator.vibrate(10);
                              }}
                              onDragEnd={(event, info) => {
                                const threshold = 25;
                                const velocity = Math.abs(info.velocity.y);
                                const offset = info.offset.y;
                                
                                // Consider both offset and velocity for more responsive reordering
                                if (Math.abs(offset) > threshold || velocity > 300) {
                                  const newIndex = offset > 0 
                                    ? Math.min(index + 1, tasks.length - 1)
                                    : Math.max(index - 1, 0);
                                  if (newIndex !== index) {
                                    reorderTasks(index, newIndex);
                                  }
                                }
                              }}
                              whileDrag={{ 
                                scale: 1.08, 
                                zIndex: 10, 
                                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                                rotate: Math.random() * 4 - 2 // Subtle random rotation
                              }}
                              layout
                              layoutId={task.id}
                              transition={{ 
                                layout: { type: "spring", stiffness: 300, damping: 30, duration: 0.6 },
                                default: { type: "spring", stiffness: 300, damping: 25 }
                              }}
                              className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-grab active:cursor-grabbing"
                            >
                              {/* Drag Handle */}
                              <motion.div 
                                className="flex flex-col gap-1 text-white/40 cursor-grab active:cursor-grabbing p-1 rounded"
                                whileHover={{ scale: 1.1, color: 'rgba(255,255,255,0.6)' }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                                <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                                <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                              </motion.div>
                              <button
                                onClick={() => toggleTask(task.id)}
                                className={`w-4 h-4 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center transition-colors duration-100 active:scale-95 flex-shrink-0 ${
                                  task.completed 
                                    ? 'bg-green-500 border-green-500' 
                                    : 'border-white/30 hover:border-white/50'
                                }`}
                              >
                                {task.completed && (
                                  <svg className="w-2 h-2 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </button>
                              <span className={`flex-1 text-white text-sm sm:text-base min-w-0 break-words ${
                                task.completed ? 'line-through opacity-60' : ''
                              }`}>
                                {task.text}
                              </span>
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="text-red-400 hover:text-red-300 transition-colors duration-100 active:scale-95 p-1 flex-shrink-0"
                              >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 112 0v3a1 1 0 11-2 0V9zm4 0a1 1 0 112 0v3a1 1 0 11-2 0V9z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {activePanel === 'thoughts' && (
                    <div className="space-y-2 sm:space-y-3">
                      {thoughts.length === 0 ? (
                        <p className="text-white/60 text-center py-6 text-sm">No thoughts captured yet. Start a focus session to capture your ideas!</p>
                      ) : (
                        thoughts.map((thought, index) => {
                          const isProcessing = thought._id && processingThoughts.has(thought._id);
                          const isCompleted = thought.isCompleted;
                          
                          return (
                            <motion.div
                              key={thought._id || index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: isProcessing ? 0.5 : 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="p-3 bg-white/5 rounded-lg border-l-4 border-blue-400"
                            >
                              <div className="flex items-start gap-2 sm:gap-3">
                                {/* CHECKBOX - Mark as completed */}
                                <button
                                  onClick={() => handleToggleComplete(thought)}
                                  disabled={isProcessing || !thought._id}
                                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg border-2 flex items-center justify-center font-bold text-xs sm:text-sm mt-1 flex-shrink-0 ${
                                    isCompleted
                                      ? 'bg-green-500 border-green-400 text-white'
                                      : 'bg-white/10 border-white/40 text-white hover:bg-white/20 hover:border-white/60'
                                  }`}
                                  title={isCompleted ? 'Mark as not completed' : 'Mark as completed'}
                                >
                                  {isCompleted ? '✓' : '□'}
                                </button>
                                
                                {/* THOUGHT CONTENT */}
                                <div className="flex-1 min-w-0">
                                  <p className={`text-white/90 text-sm mb-2 break-words ${
                                    isCompleted ? 'line-through opacity-60' : ''
                                  }`}>
                                    {thought.text}
                                  </p>
                                  <div className="flex items-center justify-between text-xs text-white/50 gap-2">
                                    <span className="truncate">
                                      {new Date(thought.timestamp).toLocaleDateString()} at{' '}
                                      {new Date(thought.timestamp).toLocaleTimeString()}
                                    </span>
                                    {thought.session && (
                                      <span className="px-2 py-1 bg-white/10 rounded text-xs whitespace-nowrap">
                                        {thought.session.mode} session
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* DELETE BUTTON */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleDeleteThought(thought);
                                  }}
                                  disabled={isProcessing || !thought._id}
                                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-red-500/30 border-2 border-red-400/50 flex items-center justify-center text-white font-bold text-xs sm:text-sm hover:bg-red-500/50 hover:border-red-400 flex-shrink-0 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Delete this thought"
                                >
                                  ✕
                                </button>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}