import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { getLoginUrl } from "@/const";
import { CLASSES, CLASS_LABELS, SUBJECTS_BY_CLASS, ClassLevel, Subject } from "@shared/curriculum";
import { INDIAN_LANGUAGE_OPTIONS, IndianLanguage } from "@shared/languages";
import { Loader2, Sparkles, BookOpen, Lightbulb } from "lucide-react";
import { Streamdown } from 'streamdown';
import { trpc } from "@/lib/trpc";
import { toast } from 'sonner';
import { startSpeechRecognition, stopSpeechRecognition, speakText, stopSpeech, getLanguageCode, isSpeaking } from "@/lib/voiceUtils";
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface LessonItem {
  id: number;
  class: string;
  subject: string;
  topic: string;
  toolType: 'simplify' | 'activity' | 'understanding';
  content: string;
  createdAt: Date;
}

interface RefinementItem {
  id: number;
  lessonId: number;
  refinementType: string;
  refinedContent: string;
  createdAt: Date;
}

interface AnswerItem {
  id: number;
  lessonId: number;
  questionNumber: number;
  answerText: string;
  createdAt: Date;
}

export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [selectedClass, setSelectedClass] = useState<ClassLevel>('10');
  const [selectedSubject, setSelectedSubject] = useState<Subject>('Mathematics');
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState<'english' | 'hindi' | IndianLanguage>('english');
  const [isLoading, setIsLoading] = useState(false);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [refinements, setRefinements] = useState<Map<number, RefinementItem[]>>(new Map());
  const [answers, setAnswers] = useState<Map<number, AnswerItem[]>>(new Map());
  const [showAnswers, setShowAnswers] = useState<Map<number, boolean>>(new Map());
  const [refinementInput, setRefinementInput] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const generateMutation = trpc.lessons.generateLesson.useMutation();
  const refineMutation = trpc.lessons.refineLesson.useMutation();
  const updateMutation = trpc.lessons.updateLesson.useMutation();

  const subjects = SUBJECTS_BY_CLASS[selectedClass] || [];

  useEffect(() => {
    if (subjects.length > 0 && !subjects.includes(selectedSubject as Subject)) {
      setSelectedSubject(subjects[0]);
    }
  }, [selectedClass, subjects, selectedSubject]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lessons, refinements]);

  const handleGenerateContent = async (toolType: 'simplify' | 'activity' | 'understanding') => {
    if (!topic.trim()) {
      alert('Please enter a topic');
      return;
    }

    setIsLoading(true);
    setRefinementInput('');
    setSelectedLessonId(null); // Auto-close previous content

    try {
      const result = await generateMutation.mutateAsync({
        class: selectedClass,
        subject: selectedSubject,
        topic,
        toolType,
        language,
      });

      const newLesson: LessonItem = {
        id: result.id,
        class: selectedClass,
        subject: selectedSubject,
        topic,
        toolType,
        content: result.content,
        createdAt: result.createdAt || new Date(),
      };
      
      // If Check Understanding, show answer reveal button
      if (toolType === 'understanding') {
        setShowAnswers(new Map(showAnswers).set(result.id, false));
      }

      setLessons([...lessons, newLesson]);
      setSelectedLessonId(result.id);
    } catch (error: any) {
      console.error('Error generating content:', error);
      alert('Error generating content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = async (refinementType: string) => {
    if (selectedLessonId === null || !refinementType.trim()) return;

    setIsLoading(true);

    try {
      const result = await refineMutation.mutateAsync({
        lessonId: selectedLessonId,
        refinementType,
      });

      const newRefinement: RefinementItem = {
        id: Math.random(), // Temporary ID for UI
        lessonId: selectedLessonId!,
        refinementType,
        refinedContent: result.refinedContent,
        createdAt: result.createdAt || new Date(),
      };

      const lessonRefinements = refinements.get(selectedLessonId) || [];
      setRefinements(new Map(refinements).set(selectedLessonId, [...lessonRefinements, newRefinement]));
      setRefinementInput('');
    } catch (error) {
      console.error('Error refining content:', error);
      alert('Error refining content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-foreground/70">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="glass-lg p-8 mb-6">
            <BookOpen className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">Universal Classroom Assistant</h1>
            <p className="text-foreground/70 mb-6">AI-powered teaching tools for CBSE/NCERT educators</p>
            <Button
              onClick={() => window.location.href = getLoginUrl()}
              className="w-full btn-simplify"
            >
              Sign In to Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleStartListening = () => {
    const langCode = getLanguageCode(language);
    setIsListening(true);
    recognitionRef.current = startSpeechRecognition(
      (text) => {
        setTopic(prev => prev + (prev ? ' ' : '') + text);
        setIsListening(false);
        toast.success('Topic recorded');
      },
      (error) => {
        console.error(error);
        setIsListening(false);
        toast.error(error);
      },
      langCode
    );
  };

  const handleStopListening = () => {
    stopSpeechRecognition(recognitionRef.current);
    setIsListening(false);
  };

  const handleSpeakContent = (content: string) => {
    const langCode = getLanguageCode(language);
    setIsSpeakingNow(true);
    speakText(content, { language: langCode }, () => {
      setIsSpeakingNow(false);
    });
  };

  const handleStopSpeaking = () => {
    stopSpeech();
    setIsSpeakingNow(false);
  };

  const currentRefinements = selectedLessonId !== null ? (refinements.get(selectedLessonId) || []) : [];

  return (
    <div className="min-h-screen bg-black">
      <header className="bg-white/6 backdrop-blur-lg border border-white/10 border-b sticky top-0 z-40 backdrop-blur-xl">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h1 className="text-xl font-bold text-foreground">Universal Classroom Assistant</h1>
          </div>
          <Button variant="ghost" size="sm" className="text-foreground/70 hover:text-foreground">
            {user?.name || 'Teacher'}
          </Button>
        </div>
      </header>

      <main className="container py-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="glass-lg p-6 sticky top-20 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value as ClassLevel)}
                  className="select-glass"
                >
                  {CLASSES.map(cls => (
                    <option key={cls} value={cls}>
                      {CLASS_LABELS[cls]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value as Subject)}
                  className="select-glass"
                >
                  {subjects.map(subj => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Topic / Chapter</label>
                <div className="flex gap-2">
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Newton's Third Law, Photosynthesis, French Revolution..."
                    className="textarea-glass h-24 flex-1"
                  />
                  <button
                    onClick={isListening ? handleStopListening : handleStartListening}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      isListening
                        ? 'bg-red-500/80 hover:bg-red-600 text-white'
                        : 'bg-blue-500/80 hover:bg-blue-600 text-white'
                    } flex items-center justify-center`}
                    title={isListening ? 'Stop listening' : 'Start listening'}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'english' | 'hindi' | IndianLanguage)}
                  className="select-glass"
                >
                  <option value="english">English</option>
                  <option value="hindi">हिंदी (Hindi)</option>
                  <optgroup label="Indian Languages">
                    {INDIAN_LANGUAGE_OPTIONS.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleGenerateContent('simplify')}
                  disabled={isLoading || !topic.trim()}
                  className="btn-simplify w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lightbulb className="w-4 h-4" />
                  Simplify Concept
                </button>
                <button
                  onClick={() => handleGenerateContent('activity')}
                  disabled={isLoading || !topic.trim()}
                  className="btn-activity w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4" />
                  Class Activity
                </button>
                <button
                  onClick={() => handleGenerateContent('understanding')}
                  disabled={isLoading || !topic.trim()}
                  className="btn-understanding w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <BookOpen className="w-4 h-4" />
                  Check Understanding
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-4 scrollbar-hide">
              {lessons.length === 0 ? (
                <div className="glass-lg p-12 text-center">
                  <BookOpen className="w-12 h-12 text-purple-400/50 mx-auto mb-4" />
                  <p className="text-foreground/50">Select a class, subject, and topic to get started</p>
                </div>
              ) : (
                <>
                  {lessons.map((lesson) => (
                    <div 
                      key={lesson.id} 
                      className={`space-y-3 transition-all duration-300 overflow-hidden ${
                        selectedLessonId === lesson.id ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div
                        onClick={() => setSelectedLessonId(lesson.id)}
                        className={`message-bubble message-ai cursor-pointer transition-all ${
                          selectedLessonId === lesson.id ? 'ring-2 ring-purple-500' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            lesson.toolType === 'simplify' ? 'bg-green-500/20 text-green-300' :
                            lesson.toolType === 'activity' ? 'bg-blue-500/20 text-blue-300' :
                            'bg-amber-500/20 text-amber-300'
                          }`}>
                            {lesson.toolType === 'simplify' ? 'Simplify Concept' :
                             lesson.toolType === 'activity' ? 'Class Activity' :
                             'Check Understanding'}
                          </div>
                          {selectedLessonId === lesson.id && (
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isSpeakingNow) {
                                    handleStopSpeaking();
                                  } else {
                                    handleSpeakContent(lesson.content);
                                  }
                                }}
                                className="text-foreground/50 hover:text-foreground transition-colors text-lg"
                                title={isSpeakingNow ? 'Stop speaking' : 'Speak content'}
                              >
                                {isSpeakingNow ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await navigator.clipboard.writeText(lesson.content);
                                    toast.success('Copied to clipboard!');
                                  } catch (err) {
                                    toast.error('Failed to copy to clipboard');
                                  }
                                }}
                                className="text-foreground/50 hover:text-foreground transition-colors text-lg"
                                title="Copy to clipboard"
                              >
                                📋
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingLessonId(editingLessonId === lesson.id ? null : lesson.id);
                                  setEditedContent(lesson.content);
                                }}
                                className="text-foreground/50 hover:text-foreground transition-colors text-lg"
                                title={editingLessonId === lesson.id ? 'Cancel edit' : 'Edit content'}
                              >
                                {editingLessonId === lesson.id ? '✕' : '✏️'}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLessonId(null);
                                }}
                                className="text-foreground/50 hover:text-foreground transition-colors text-lg font-bold"
                                title="Close"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-foreground/70 mb-3">
                          <span className="font-semibold">{lesson.subject}</span> • {lesson.topic}
                        </p>
                        {editingLessonId === lesson.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editedContent}
                              onChange={(e) => setEditedContent(e.target.value)}
                              className="w-full p-3 bg-background/50 border border-purple-500/30 rounded-lg text-foreground text-sm focus:outline-none focus:border-purple-500 min-h-[200px] font-mono"
                              placeholder="Edit your content here..."
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await updateMutation.mutateAsync({
                                      lessonId: lesson.id,
                                      content: editedContent,
                                    });
                                    const updatedLessons = lessons.map(l => 
                                      l.id === lesson.id ? { ...l, content: editedContent } : l
                                    );
                                    setLessons(updatedLessons);
                                    setEditingLessonId(null);
                                    toast.success('Content updated!');
                                  } catch (error) {
                                    toast.error('Failed to update');
                                  }
                                }}
                                disabled={updateMutation.isPending}
                                className="flex-1 btn-glass text-sm"
                              >
                                {updateMutation.isPending ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingLessonId(null);
                                }}
                                className="flex-1 btn-glass text-sm opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <Streamdown className="text-foreground">{lesson.content}</Streamdown>
                        )}
                      </div>

                      {currentRefinements.length > 0 && selectedLessonId !== null && selectedLessonId === lesson.id && (
                        <div className="space-y-2 ml-4 border-l-2 border-purple-500/30 pl-4">
                          {currentRefinements.map((ref, idx) => (
                            <div key={idx} className="message-bubble message-ai">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <p className="text-xs text-purple-300 font-semibold">Refined: {ref.refinementType}</p>
                                <button
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(ref.refinedContent);
                                      toast.success('Copied to clipboard!');
                                    } catch (err) {
                                      toast.error('Failed to copy to clipboard');
                                    }
                                  }}
                                  className="text-foreground/50 hover:text-foreground transition-colors text-sm"
                                  title="Copy refinement"
                                >
                                  📋
                                </button>
                              </div>
                              <Streamdown className="text-foreground">{ref.refinedContent}</Streamdown>
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedLessonId === lesson.id && lesson.toolType === 'understanding' && (
                        <button
                          onClick={() => setShowAnswers(new Map(showAnswers).set(lesson.id, !showAnswers.get(lesson.id)))}
                          className="btn-glass w-full mb-3"
                        >
                          {showAnswers.get(lesson.id) ? 'Hide Answers' : 'Show Answers'}
                        </button>
                      )}

                      {selectedLessonId === lesson.id && showAnswers.get(lesson.id) && lesson.toolType === 'understanding' && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-3">
                          <p className="text-xs font-semibold text-amber-300 mb-3">📝 Expected Answers</p>
                          <div className="space-y-2">
                            {[1, 2, 3].map((qNum) => {
                              const answerMatch = lesson.content.match(new RegExp(`ANSWER\\s+${qNum}:\\s*(.+?)(?=QUESTION|ANSWER|$)`, 'i'));
                              if (!answerMatch) return null;
                              return (
                                <div key={qNum} className="text-sm">
                                  <p className="font-semibold text-amber-200 mb-1">Answer {qNum}:</p>
                                  <p className="text-foreground/80 text-xs">{answerMatch[1].trim().substring(0, 200)}...</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {selectedLessonId === lesson.id && (
                        <div className="bg-white/6 backdrop-blur-lg border border-white/10 rounded-xl p-4 space-y-3">
                          <div className="flex gap-2 flex-wrap">
                            {['Make simpler', 'Add examples', 'Shorter'].map((chip) => (
                              <button
                                key={chip}
                                onClick={() => handleRefine(chip)}
                                disabled={isLoading}
                                className="chip disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {chip}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={refinementInput}
                              onChange={(e) => setRefinementInput(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && refinementInput.trim()) {
                                  handleRefine(refinementInput);
                                }
                              }}
                              placeholder="Refine this..."
                              className="input-glass flex-1"
                              disabled={isLoading}
                            />
                            <button
                              onClick={() => refinementInput.trim() && handleRefine(refinementInput)}
                              disabled={isLoading || !refinementInput.trim()}
                              className="btn-glass disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
