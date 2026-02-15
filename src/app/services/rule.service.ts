import { Injectable, signal } from '@angular/core';
import { RuleData } from '../models/rule.model';
import rulesJson from '../../../public/compendium/rules/rules.json';

@Injectable({
  providedIn: 'root'
})
export class RuleService {

  private readonly _rules = signal<RuleData[]>([]);
  private readonly _loading = signal(false);

  rules = this._rules.asReadonly();
  loading = this._loading.asReadonly();

  load(): void {
    if (this._rules().length > 0) return;

    this._loading.set(true);

    const conditions: RuleData[] = rulesJson.condition.map((r: any) => ({
      ...r,
      category: 'condition'
    }));

    const diseases: RuleData[] = rulesJson.disease.map((r: any) => ({
      ...r,
      category: 'disease'
    }));

    this._rules.set([
      ...conditions,
      ...diseases
    ]);

    this._loading.set(false);
  }

}
