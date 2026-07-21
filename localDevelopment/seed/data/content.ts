// Mock notes, questions, responses, and goals. `authorUsername` /
// `userUsername` are resolved to real user ids by seed.ts after the users
// table has been populated.
export const notes = [
  { authorUsername: "alice", content: "Remember to review the Q3 roadmap." },
  { authorUsername: "bob", content: "Ideas for the next sprint planning." },
];

export const questions = [
  { authorUsername: "alice", body: "What's the best way to structure a GraphQL schema?" },
  { authorUsername: "carol", body: "How do you handle auth in Apollo Server v4?" },
];

export const responses = [
  {
    questionBody: "What's the best way to structure a GraphQL schema?",
    authorUsername: "bob",
    body: "Split it into per-model type files and compose them with @graphql-tools/schema.",
  },
];

export const goals = [
  {
    userUsername: "alice",
    content: "Ship the local dev environment",
    dueDate: "2026-08-01T00:00:00.000Z",
  },
  {
    userUsername: "bob",
    content: "Write more integration tests",
    dueDate: "2026-09-01T00:00:00.000Z",
  },
];
