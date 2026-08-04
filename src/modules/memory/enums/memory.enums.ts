export const MemoryScope = {
  USER: 'USER',
  GROUP: 'GROUP',
} as const;

export type MemoryScope = (typeof MemoryScope)[keyof typeof MemoryScope];

export const MemoryType = {
  FACT: 'FACT',
  PREFERENCE: 'PREFERENCE',
  RELATIONSHIP: 'RELATIONSHIP',
  PROJECT: 'PROJECT',
  EVENT: 'EVENT',
  OTHER: 'OTHER',
} as const;

export type MemoryType = (typeof MemoryType)[keyof typeof MemoryType];

export const MemoryStatus = {
  ACTIVE: 'ACTIVE',
  SUPERSEDED: 'SUPERSEDED',
  REJECTED: 'REJECTED',
} as const;

export type MemoryStatus = (typeof MemoryStatus)[keyof typeof MemoryStatus];
