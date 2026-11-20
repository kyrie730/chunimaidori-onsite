// Fields from `users` that are safe to expose to the client.
export const USER_PROJECTION = {
  _id: 1,
  email: 1,
  fullName: 1,
  phoneNumber: 1,
  region: 1,
  birthInfo: 1,
  flag: 1,
  maimaiCredential: 1,
  chunithmCredential: 1,
  "compCredential.discordId": 1,
} as const;

export const CHECKIN_PROJECTION = {
  _id: 1,
  checkInStatus: 1,
  takenBy: 1,
  hasTakenJersey: 1,
  user: 1,
} as const;
