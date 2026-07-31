import { NextResponse } from 'next/server';

interface ParsedRule {
  targetItem: string;
  maxBudget: number;
  trigger: string;
  naturalLanguageQuery: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    const trimmedPrompt = prompt.trim();
    const apiKey = process.env.OPENAI_API_KEY;

    let parsedRule: ParsedRule | null = null;

    if (apiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content:
                  'You are an agentic commerce assistant. Extract rule details from the user prompt into structured JSON. Extract targetItem (e.g. domain name, product name), maxBudget (number in USD), and trigger (e.g. "Price drops below $60.00" or "Available for purchase").',
              },
              {
                role: 'user',
                content: trimmedPrompt,
              },
            ],
            response_format: {
              type: 'json_schema',
              json_schema: {
                name: 'rule_parser_output',
                strict: true,
                schema: {
                  type: 'object',
                  properties: {
                    targetItem: {
                      type: 'string',
                      description: 'The target item, domain name, or product name',
                    },
                    maxBudget: {
                      type: 'number',
                      description: 'Maximum budget allocated in USD',
                    },
                    trigger: {
                      type: 'string',
                      description: 'Human readable trigger condition (e.g. Price drops below $60.00)',
                    },
                  },
                  required: ['targetItem', 'maxBudget', 'trigger'],
                  additionalProperties: false,
                },
              },
            },
            temperature: 0.1,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const jsonContent = data.choices?.[0]?.message?.content;
          if (jsonContent) {
            const rawParsed = JSON.parse(jsonContent);
            parsedRule = {
              targetItem: rawParsed.targetItem || 'Target Item',
              maxBudget: Number(rawParsed.maxBudget) || 100,
              trigger: rawParsed.trigger || `Price drops below $${rawParsed.maxBudget || 100}`,
              naturalLanguageQuery: trimmedPrompt,
            };
          }
        } else {
          console.warn('OpenAI API returned non-200 status:', response.status, await response.text());
        }
      } catch (err) {
        console.warn('OpenAI API call failed, falling back to local parsing:', err);
      }
    }

    // Fallback heuristic parser if OpenAI API key is missing or call fails
    if (!parsedRule) {
      parsedRule = fallbackParseRule(trimmedPrompt);
    }

    return NextResponse.json({
      success: true,
      parsed: parsedRule,
      source: apiKey ? 'openai' : 'heuristic_fallback',
    });
  } catch (error: any) {
    console.error('API /api/parse-rule POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to parse rule' },
      { status: 500 }
    );
  }
}

/**
 * Intelligent local fallback parser for standard rule prompts
 */
function fallbackParseRule(prompt: string): ParsedRule {
  // Extract price (e.g., "$60", "under 60", "< 60", "$120.50")
  const priceMatch = prompt.match(/(?:\$|USD\s*|under\s*\$*|less than\s*\$*|<\s*\$*)(\d+(?:\.\d{1,2})?)/i) ||
                     prompt.match(/(\d+(?:\.\d{1,2})?)\s*(?:usd|\$|dollars)/i);
  
  let maxBudget = priceMatch ? parseFloat(priceMatch[1]) : 60;

  // Extract target item (domains like indigo.dev, or product names)
  let targetItem = 'Unknown Asset';
  const domainMatch = prompt.match(/([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/);

  if (domainMatch) {
    targetItem = domainMatch[1].toLowerCase();
  } else {
    // Extract noun phrase after buy/acquire/monitor
    const actionMatch = prompt.match(/(?:buy|acquire|monitor|get|purchase)\s+([a-zA-Z0-9-._\s]+?)(?:\s+under|\s+for|\s+below|\s+if|\s+when|\$|\d|$)/i);
    if (actionMatch && actionMatch[1].trim()) {
      targetItem = actionMatch[1].trim();
    } else {
      targetItem = prompt.split(' ')[0] || 'Target Item';
    }
  }

  const trigger = `Price drops below $${maxBudget.toFixed(2)}`;

  return {
    targetItem,
    maxBudget,
    trigger,
    naturalLanguageQuery: prompt,
  };
}
