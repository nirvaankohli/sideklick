import {
  assistRequestSchema,
  assistResponseSchema,
} from "../schema";
import type {
  AssistResponse,
  BuiltContext,
  ModelAssistOutput,
} from "../type";
import { buildContext } from "./context";
import { persistAssistMemory } from "./memory";
import { requestAssistFromOpenAI } from "./openai";

type NormalizedAssistPayload = Omit<AssistResponse, "interactionId">;

function normalizeModelAssistOutput(
  modelOutput: ModelAssistOutput,
  builtContext: BuiltContext,
): NormalizedAssistPayload {
  // Normalize model-owned snake_case into the app's camelCase response shape.
  return {
    answer: modelOutput.student_response,
    nextStep: modelOutput.next_step,
    context: builtContext,
    gapCandidates: modelOutput.possible_gaps,
  };
}

export async function handleAssistRequest(
  input: unknown,
): Promise<AssistResponse> {
  // Route flow:
  // 1. validate request
  // 2. build local context
  // 3. call the model
  // 4. normalize model JSON into app JSON
  // 5. persist interaction + gap memory
  // 6. validate the final response shape
  const requestInput = assistRequestSchema.parse(input);
  const builtContext = buildContext(requestInput.classId, requestInput);
  const modelOutput = await requestAssistFromOpenAI(
    builtContext,
    requestInput,
  );
  const normalizedPayload = normalizeModelAssistOutput(
    modelOutput,
    builtContext,
  );
  // Persist first so the API can return the real interaction ID the frontend
  // should send back later to `/api/feedback`.
  const interactionId = persistAssistMemory(
    requestInput,
    normalizedPayload,
    builtContext,
  );
  const validatedResponse = assistResponseSchema.parse({
    interactionId,
    ...normalizedPayload,
  });

  // Final response validation ensures the route only returns the backend's
  // canonical shape, regardless of how the model responded internally.
  return validatedResponse;
}
