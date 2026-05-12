import { inject, Injectable } from '@angular/core';
import { AppAbility } from '../types/app-ability.type';
import { subject as caslSubject } from '@casl/ability';

@Injectable({
  providedIn: 'root',
})
export class CaslService {
  private ability = inject(AppAbility);

  can(action: string, subjectObj: any, field?: string): boolean {
    if (subjectObj && typeof subjectObj === 'object') {
      // Якщо є __typename (від Apollo), використовуємо його як тип
      if (subjectObj.__typename) {
        // Створюємо копію { ...subjectObj }, щоб уникнути помилки "not extensible"
        return this.ability.can(action, caslSubject(subjectObj.__typename, { ...subjectObj }), field);
      }
    }
    
    return this.ability.can(action, subjectObj, field);
  }

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