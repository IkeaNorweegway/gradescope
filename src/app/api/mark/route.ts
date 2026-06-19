import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { RubricCriterion, CriterionScore } from '@/lib/types';

interface MarkRequest {
  imageBase64: string;
  imageMediaType: string;
  assignment: {
    title: string;
    subject: string;
    description: string;
    rubric: RubricCriterion[];
    max_marks: number;
  };
  studentName: string;
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) {
    return NextResponse.json({ error: 'No API key provided' }, { status: 401 });
  }

  const body: MarkRequest = await req.json();
  const { imageBase64, imageMediaType, assignment, studentName } = body;

  const client = new Anthropic({ apiKey });

  const rubricText = assignment.rubric
    .map((c) => `- ${c.name} (${c.max_points} pts): ${c.description}`)
    .join('\n');

  const prompt = `You are an experienced teacher marking a student assignment. 

**Assignment:** ${assignment.title}
**Subject:** ${assignment.subject}
**Description:** ${assignment.description || 'N/A'}
**Student:** ${studentName}

**Rubric:**
${rubricText}
**Total possible marks:** ${assignment.max_marks}

Please carefully examine the student's work in the image and mark it according to the rubric above.

Respond with ONLY valid JSON in this exact format:
{
  "rubric_scores": [
    {
      "criterion_id": "<id from rubric>",
      "criterion_name": "<name>",
      "score": <number>,
      "max_points": <number>,
      "comment": "<specific comment about this criterion>"
    }
  ],
  "total_score": <number>,
  "ai_feedback": "<2-3 sentence overall feedback on the work>",
  "conceptual_notes": "<Assessment of student's conceptual understanding of the curriculum topic — what they understand deeply, what's surface-level, and any misconceptions>",
  "strengths": "<What the student did well>",
  "areas_for_improvement": "<Specific, actionable things the student should focus on next>"
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: imageMediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: imageBase64,
            },
          },
          { type: 'text', text: prompt },
        ],
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  
  // Strip markdown code fences if present
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  const jsonStr = jsonMatch[1].trim();

  let result;
  try {
    result = JSON.parse(jsonStr);
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response', raw: text }, { status: 500 });
  }

  // Attach criterion_ids from the rubric in case AI missed them
  const scores: CriterionScore[] = assignment.rubric.map((criterion) => {
    const aiScore = result.rubric_scores?.find(
      (s: CriterionScore) => s.criterion_name === criterion.name || s.criterion_id === criterion.id
    );
    return {
      criterion_id: criterion.id,
      criterion_name: criterion.name,
      score: aiScore?.score ?? 0,
      max_points: criterion.max_points,
      comment: aiScore?.comment ?? '',
    };
  });

  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const percentage = Math.round((totalScore / assignment.max_marks) * 100);

  return NextResponse.json({
    rubric_scores: scores,
    grade: totalScore,
    percentage,
    ai_feedback: result.ai_feedback || '',
    conceptual_notes: result.conceptual_notes || '',
    strengths: result.strengths || '',
    areas_for_improvement: result.areas_for_improvement || '',
  });
}
