"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { LessonPlan } from '@/types/lesson-planner';
import { Loader2, BookOpen } from 'lucide-react';

interface LessonPlanFormProps {
  onSubmit: (lessonPlan: LessonPlan) => Promise<void>;
  isLoading: boolean;
}

export function LessonPlanForm({ onSubmit, isLoading }: LessonPlanFormProps) {
  const [lessonPlan, setLessonPlan] = useState<LessonPlan>({
    topic: '',
    gradeLevel: '',
    mainConcept: '',
    materials: '',
    objectives: '',
    outline: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLessonPlan(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lessonPlan.topic.trim() || !lessonPlan.gradeLevel.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    await onSubmit(lessonPlan);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <BookOpen className="h-6 w-6 text-blue-600" />
          Create Lesson Plan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Topic *
              </label>
              <Input
                name="topic"
                value={lessonPlan.topic}
                onChange={handleChange}
                placeholder="Enter lesson topic"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Grade Level *
              </label>
              <Input
                name="gradeLevel"
                value={lessonPlan.gradeLevel}
                onChange={handleChange}
                placeholder="e.g., 5th Grade, High School"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Main Concept (Optional)
            </label>
            <Input
              name="mainConcept"
              value={lessonPlan.mainConcept}
              onChange={handleChange}
              placeholder="Enter main concept or learning goal"
              disabled={isLoading}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Plan...
              </>
            ) : (
              'Create Lesson Plan'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
