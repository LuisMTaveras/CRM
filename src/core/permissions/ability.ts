export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage';
export type Subject = string | Record<string, unknown>;

export interface Rule {
  action: Action | Action[];
  subject: string;
  conditions?: (subjectData: Record<string, unknown>, user: Record<string, unknown>) => boolean;
}

export class Ability {
  private _rules: Rule[] = [];
  private user: Record<string, unknown> | null = null;

  setUser(user: unknown) {
    this.user = (user && typeof user === 'object') ? (user as Record<string, unknown>) : null;
  }

  updateRules(rules: Rule[]) {
    this._rules = rules;
  }

  get rules(): Rule[] {
    return [...this._rules];
  }

  can(action: Action, subject: Subject, subjectData?: Record<string, unknown>): boolean {
    const subjectName = typeof subject === 'string' ? subject : (subject.constructor?.name || 'Object');
    const data = typeof subject === 'object' ? subject : subjectData;

    for (const rule of this._rules) {
      const actionMatches = Array.isArray(rule.action)
        ? rule.action.includes(action) || rule.action.includes('manage')
        : rule.action === action || rule.action === 'manage';

      const subjectMatches = rule.subject === subjectName || rule.subject === 'all';

      if (actionMatches && subjectMatches) {
        if (!rule.conditions) return true;
        if (data && this.user && rule.conditions(data, this.user)) return true;
      }
    }

    return false;
  }
}

export const globalAbility = new Ability();
