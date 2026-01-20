import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type IssueType = 'Marked available but actually full' | 'Bay/zone blocked' | 'Wrong recommendation' | 'Other';
export type IssueStatus = 'OPEN' | 'RESOLVED';

export interface Issue {
    id: string;
    zoneId: string;
    type: IssueType;
    note?: string;
    createdAt: number;
    status: IssueStatus;
}

interface IssueState {
    issues: Issue[];
    addIssue: (issue: Omit<Issue, 'id' | 'createdAt' | 'status'>) => void;
}

export const useIssuesStore = create<IssueState>()(
    persist(
        (set) => ({
            issues: [],
            addIssue: (issue) => set((state) => ({
                issues: [
                    {
                        ...issue,
                        id: crypto.randomUUID(),
                        createdAt: Date.now(),
                        status: 'OPEN',
                    },
                    ...state.issues
                ]
            })),
        }),
        {
            name: 'issues-storage',
        }
    )
);
