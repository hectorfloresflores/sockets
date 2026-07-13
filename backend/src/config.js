// Socketgram configuration.
// NOTE: For a real production app you would NEVER hardcode passwords like this.
// This is a teaching demo, so the passwords are intentionally embedded and easy
// to change. Override them with environment variables when deploying if you like.

export const CONFIG = {
  // Password every student must type to join the chat group.
  JOIN_PASSWORD: process.env.JOIN_PASSWORD || 'letmein',

  // Password required to wipe the chat history + name colors.
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',

  // HTTP port the server listens on.
  PORT: Number(process.env.PORT) || 3001,

  // Max length of a single chat message (basic safety).
  MAX_MESSAGE_LENGTH: 2000,

  // Max length of a username.
  MAX_NAME_LENGTH: 24,
};
