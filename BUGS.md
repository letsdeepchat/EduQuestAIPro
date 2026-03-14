# EduQuest AI - Bug Report & Analysis

## 1. Accessibility Issues
- **Status:** Fixed
- **Details:** Form controls in `ModelSelector` were not associated with their labels (`htmlFor` and `id` were missing). This made it difficult for screen readers and automated tests to interact with the form.

## 2. Brittle JSON Parsing
- **Status:** Pending Fix
- **Details:** The `aiService.ts` relies on `JSON.parse(response.text)`. If the AI model includes any conversational text (e.g., "Here is your JSON: ...") before or after the JSON block, the parsing will fail.
- **Impact:** High. Non-Gemini models often include preamble text.

## 3. Hardcoded Image Generation Key
- **Status:** Pending Fix
- **Details:** `generateImageForQuestion` uses `process.env.API_KEY` directly. If the app is deployed without this environment variable, image generation will fail silently.
- **Impact:** Medium. Visual aids won't work.

## 4. Meta Llama Endpoint
- **Status:** Pending Fix
- **Details:** Selecting 'Meta Llama' uses the default OpenAI client without a `baseURL`. Most Llama providers (Groq, Together, OpenRouter) require a specific `baseURL`.
- **Impact:** High. Llama models won't work unless the user is using a local proxy on the default OpenAI port.

## 5. Interview Session TTS Fallback
- **Status:** Pending Fix
- **Details:** If the user doesn't have a Google API key in the environment, the `speak` function in `InterviewSession.tsx` might fail if `speechSynthesis` is also unavailable or restricted.
- **Impact:** Low. Voice features might be silent.

## 6. Race Conditions in Quiz/Interview
- **Status:** Analysis
- **Details:** Fast navigation between questions or states might trigger multiple AI calls if not properly debounced or cancelled.
- **Impact:** Low. Potential for UI flickering or duplicate calls.

---

## Proposed Test Plan

### Unit Tests
- `aiService.ts`: Test `extractJSON` with various malformed AI responses.
- `ModelSelector.tsx`: Test persistence and state management (Done).

### Integration Tests
- `App.tsx`: Test the flow from configuration to syllabus generation.
- `Quiz.tsx`: Test scoring logic and state transitions.

### End-to-End Tests
- Full flow: Config -> Setup -> Syllabus -> Quiz -> Results.
- Full flow: Config -> Setup -> Syllabus -> Interview -> Feedback.
