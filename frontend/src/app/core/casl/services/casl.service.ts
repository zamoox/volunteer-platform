import { inject, Injectable } from '@angular/core';
import { AppAbility } from '../types/app-ability.type';

@Injectable({
  providedIn: 'root',
})
export class CaslService {
  private ability = inject(AppAbility);

  updateAbility(rules: any[] = []) {
    const normalizedRules = (rules ?? []).map((rule) => {
      if (typeof rule?.conditions !== 'string') {
        return rule;
      }

      try {
        return {
          ...rule,
          conditions: JSON.parse(rule.conditions),
        };
      } catch {
        return rule;
      }
    });

    this.ability.update(normalizedRules);
  }

  updateRules(rules: any[] = []) {
    this.updateAbility(rules);
  }

  clear() {
    this.ability.update([]);
  }
}