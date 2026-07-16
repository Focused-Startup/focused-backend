// Mock users for local development seeding. Passwords here are plaintext
// placeholders for local-only use — do NOT reuse this pattern anywhere that
// touches the real password hashing logic used by the API.
export const users = [
  {
    email: "alice@example.com",
    password: "password123",
    username: "alice",
    firstName: "Alice",
    lastName: "Anderson",
  },
  {
    email: "bob@example.com",
    password: "password123",
    username: "bob",
    firstName: "Bob",
    lastName: "Brown",
  },
  {
    email: "carol@example.com",
    password: "password123",
    username: "carol",
    firstName: "Carol",
    lastName: "Carter",
  },
];
