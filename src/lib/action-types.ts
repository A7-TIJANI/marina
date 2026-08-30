// Shared types for Server Action return values.
// Lives outside any "use server" file so it can be imported by both
// Server Actions and Client Components without restriction.

export interface ActionState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

export const initialActionState: ActionState = { ok: false };
