import type { StateCode } from './site';

export type Phase = 'now' | 'weeks' | 'month' | 'months' | 'closing';

export const PHASES: { id: Phase; title: string; when: string; note: string }[] = [
  { id: 'now', title: 'The first days', when: 'Now', note: 'Only a few things genuinely need to happen straight away. The rest can wait until after the funeral.' },
  { id: 'weeks', title: 'The first two weeks', when: 'Weeks 1–2', note: 'Get the death certificate and certified copies, then start telling the institutions that have deadlines.' },
  { id: 'month', title: 'The first month', when: 'Weeks 2–6', note: 'Build the picture of the estate, decide whether you need probate, and stay inside the deadlines that matter.' },
  { id: 'months', title: 'Months two to six', when: 'Months 2–6', note: 'Probate, collecting assets, paying debts, and the waiting periods that protect you as executor.' },
  { id: 'closing', title: 'Finalising the estate', when: 'Months 6–18', note: 'Tax, distribution, and closing the file. Most Australian estates take between six and eighteen months.' },
];

export interface Answers {
  state: StateCode | '';
  role: 'executor' | 'family' | 'unsure';
  will: 'yes' | 'no' | 'unsure';
  unexpected: boolean;
  partner: boolean;
  smsf: boolean;
  super: boolean;
  property: boolean;
  centrelink: boolean;
  business: boolean;
  debts: boolean;
  vehicle: boolean;
  shares: boolean;
}

export const DEFAULT_ANSWERS: Answers = {
  state: '', role: 'unsure', will: 'unsure', unexpected: false, partner: false,
  smsf: false, super: true, property: false, centrelink: false, business: false, debts: false, vehicle: false, shares: false,
};

export interface StepLink { label: string; href: string; states?: StateCode[] }

export interface Step {
  id: string;
  phase: Phase;
  title: string;
  summary: string;
  detail?: string[];
  needs?: string[];
  deadline?: string;
  tag?: 'urgent' | 'deadline' | 'smsf' | 'optional' | 'money';
  when?: (a: Answers) => boolean;
  links?: StepLink[];
  stateNotes?: Partial<Record<StateCode, string>>;
  guide?: string; // link to a deeper guide page
}
