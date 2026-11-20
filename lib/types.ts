export type UserInfo = {
  _id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  region: string;
  birthInfo?: string;
  flag?: Record<string, boolean>;
  maimaiCredential?: { username: string; rating: number; gameCategory: string };
  chunithmCredential?: {
    username: string;
    rating: number;
    gameCategory: string;
  };
  compCredential?: { discordId?: string };
};

export type CheckIn = {
  _id: string;
  checkInStatus: boolean;
  takenBy: string | null;
  hasTakenJersey: boolean;
  user: UserInfo;
};

export type Jersey = {
  _id: string;
  type: string;
  inGameName: string;
  size: string;
};

export type CompetitorJerseyItem = CheckIn & { jerseys: Jersey[] };

export type JerseyForm = {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  discord: string;
  jerseyName: string;
  region: string;
  address: string;
  status: string;
  jersey: { jerseyType: string; jerseySize: string }[];
  isPaymentComplete: boolean;
  isRepeatBuyer: boolean;
  hasTakenJersey: boolean;
};

export type Paged<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
