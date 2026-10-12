export const SITE = {
  name: 'Alan Estate',
  url: 'https://alanestate.com',
  tagline: 'A clear path through what comes next.',
  description:
    'A free, step-by-step plan and set of guides for what to do when someone dies in Australia, personalised to your state, the will, superannuation and any self-managed super fund.',
  email: 'hello@alanestate.com',
  /** FormSubmit alias (hides the destination mailbox). Imported by forms.ts, so it ships in the JS bundle, not in page HTML. */
  formAjax: 'https://formsubmit.co/ajax/630b17bffdccfbe1098db5acc284a769',
  /**
   * Phrases that mark a submission as spam (case-insensitive). Add to this list
   * when the same spam message keeps arriving. Also sent to FormSubmit as _blacklist.
   */
  blockedPhrases: [] as string[],
};

export const STATES = [
  { code: 'VIC', name: 'Victoria' },
  { code: 'NSW', name: 'New South Wales' },
  { code: 'QLD', name: 'Queensland' },
  { code: 'WA', name: 'Western Australia' },
  { code: 'SA', name: 'South Australia' },
  { code: 'TAS', name: 'Tasmania' },
  { code: 'ACT', name: 'Australian Capital Territory' },
  { code: 'NT', name: 'Northern Territory' },
] as const;
export type StateCode = (typeof STATES)[number]['code'];
