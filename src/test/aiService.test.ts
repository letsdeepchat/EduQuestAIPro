import { describe, it, expect } from 'vitest';
import { extractJSON } from '../../services/aiService';

describe('aiService - extractJSON', () => {
  it('parses direct JSON strings', () => {
    const input = '{"key": "value"}';
    expect(extractJSON(input)).toEqual({ key: 'value' });
  });

  it('extracts JSON from text with preamble', () => {
    const input = 'Here is the data: {"key": "value"} Hope this helps!';
    expect(extractJSON(input)).toEqual({ key: 'value' });
  });

  it('extracts JSON arrays', () => {
    const input = 'List: [{"id": 1}, {"id": 2}]';
    expect(extractJSON(input)).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('throws error if no JSON is found', () => {
    const input = 'Just some text without JSON';
    expect(() => extractJSON(input)).toThrow('No JSON found');
  });

  it('throws error if JSON is malformed', () => {
    const input = '{"key": "value"'; // Missing closing brace
    expect(() => extractJSON(input)).toThrow('No JSON found'); // Because regex might not match or parse fails
  });
});
