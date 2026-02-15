export interface RuleEntry {
  type?: string;
  items?: string[];
  colLabels?: string[];
  rows?: string[][];
  entries?: any[];
}

export interface RuleData {
  name: string;
  entries: (string | RuleEntry)[];
  source: string;
  page?: number;
  srd?: boolean;
  category: 'condition' | 'disease';
}
