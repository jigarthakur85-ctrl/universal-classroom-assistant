import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { getLoginUrl } from "@/const";
import { CLASSES, CLASS_LABELS, SUBJECTS_BY_CLASS, ClassLevel, Subject } from "@shared/curriculum";
import { Loader2, Sparkles, BookOpen, Lightbulb } from "lucide-react";
import { Streamdown } from 'streamdown';

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

export default function HomeDemo() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [selectedClass, setSelectedClass] = useState<ClassLevel>('10');
  const [selectedSubject, setSelectedSubject] = useState<Subject>('Mathematics');
  const [topic, setTopic] = useState('Newton\'s Third Law of Motion');
  const [isLoading, setIsLoading] = useState(false);
  const [lessons, setLessons] = useState<LessonItem[]>([
    {
      id: 1,
      class: '10',
      subject: 'Mathematics',
      topic: 'Newton\'s Third Law of Motion',
      toolType: 'simplify',
      content: `# Newton's Third Law of Motion - Simplified

## The Simple Version
"For every action, there is an equal and opposite reaction."

Imagine you're standing on a skateboard and you push against a wall. The wall pushes back on you with the same force, and you move backward. That's Newton's Third Law!

## Real-Life Examples

### 1. **Walking**
- You push the ground backward with your foot
- The ground pushes you forward with equal force
- This is why you move forward when you walk

### 2. **Swimming**
- You push water backward with your hands
- Water pushes you forward
- The harder you push, the faster you swim

### 3. **Rocket Launch**
- Rocket pushes hot gases downward
- Gases push the rocket upward
- This is how rockets escape Earth's gravity

### 4. **Jumping**
- You push the ground downward
- Ground pushes you upward
- You jump into the air

## Key Points to Remember
- Both forces are **equal in magnitude** (same strength)
- Both forces are **opposite in direction** (opposite ways)
- These forces act on **different objects**
- They happen **simultaneously** (at the same time)

## Why This Matters
This law explains almost everything that moves! From cars to airplanes to your daily activities, Newton's Third Law is always at work.`,
      createdAt: new Date(),
    }
  ]);
  const [refinements, setRefinements] = useState<Map<number, RefinementItem[]>>(new Map([
    [1, [
      {
        id: 1,
        lessonId: 1,
        refinementType: 'Add examples',
        refinedContent: `## Additional Real-Life Examples

### 5. **Shooting a Gun**
- Gun pushes bullet forward
- Bullet pushes gun backward (recoil)
- This is why guns kick back

### 6. **Bird Flying**
- Bird pushes air downward with wings
- Air pushes bird upward
- Bird rises into the sky

### 7. **Bouncing Ball**
- Ball pushes ground downward
- Ground pushes ball upward
- Ball bounces back up`,
        createdAt: new Date(),
      }
    ]]
  ]));
  const [refinementInput, setRefinementInput] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState<number>(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const subjects = SUBJECTS_BY_CLASS[selectedClass] || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lessons, refinements]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-foreground/70">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 mb-6">
            <BookOpen className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">Universal Classroom Assistant</h1>
            <p className="text-foreground/70 mb-6">AI-powered teaching tools for CBSE/NCERT educators</p>
            <Button
              onClick={() => window.location.href = getLoginUrl()}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl transition-all"
            >
              Sign In to Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentRefinements = refinements.get(selectedLessonId) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="bg-white/6 backdrop-blur-lg border border-white/10 border-b sticky top-0 z-40">
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
            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 sticky top-20 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value as ClassLevel)}
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Newton's Third Law, Photosynthesis, French Revolution..."
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-purple-500 h-24 resize-none"
                />
              </div>

              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Simplify Concept
                </button>
                <button className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Class Activity
                </button>
                <button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Check Understanding
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-4 scrollbar-hide">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="space-y-3">
                  <div
                    onClick={() => setSelectedLessonId(lesson.id)}
                    className={`p-4 rounded-2xl bg-white/6 backdrop-blur-lg border border-white/10 cursor-pointer transition-all ${
                      selectedLessonId === lesson.id ? 'ring-2 ring-purple-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <div className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300">
                        Simplify Concept
                      </div>
                    </div>
                    <p className="text-sm text-foreground/70 mb-3">
                      <span className="font-semibold">{lesson.subject}</span> • {lesson.topic}
                    </p>
                    <Streamdown className="text-foreground text-sm">{lesson.content}</Streamdown>
                  </div>

                  {currentRefinements.length > 0 && selectedLessonId === lesson.id && (
                    <div className="space-y-2 ml-4 border-l-2 border-purple-500/30 pl-4">
                      {currentRefinements.map((ref) => (
                        <div key={ref.id} className="p-4 rounded-2xl bg-white/6 backdrop-blur-lg border border-white/10">
                          <p className="text-xs text-purple-300 font-semibold mb-2">Refined: {ref.refinementType}</p>
                          <Streamdown className="text-foreground text-sm">{ref.refinedContent}</Streamdown>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedLessonId === lesson.id && (
                    <div className="bg-white/6 backdrop-blur-lg border border-white/10 rounded-xl p-4 space-y-3">
                      <div className="flex gap-2 flex-wrap">
                        {['Make simpler', 'Add examples', 'Shorter'].map((chip) => (
                          <button
                            key={chip}
                            className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium hover:bg-purple-500/30 transition-all"
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
                          placeholder="Refine this..."
                          className="flex-1 bg-white/8 border border-white/15 rounded-xl px-4 py-2 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button className="bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 text-purple-300 px-4 py-2 rounded-xl transition-all font-medium">
                          Send
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
