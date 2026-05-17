// requests/services/vocabulary-tagger.service.ts
import { Injectable } from '@nestjs/common';
import { RequestSubcategory, SUBCATEGORY_WEIGHTS } from '../enums/request-category.enum';

interface TagMatch {
  subcategory: RequestSubcategory;
  weight: number;
  matchedKeywords: string[];
}

// ── Словник типових звернень ────────────────────────────────────────────────
// Кожен запис: { patterns, subcategory }
// Ключові слова охоплюють типові формулювання українською мовою
const VOCABULARY: Array<{
  patterns: RegExp[];
  subcategory: RequestSubcategory;
}> = [
  // EMERGENCY_MEDICAL
  {
    patterns: [
      /невідклад/i, /швидка/i, /реанімац/i, /інсульт/i,
      /інфаркт/i, /кровотеч/i, /поранен/i, /травм/i,
      /без свідомост/i, /критичн(ий|ому|ого) стан/i,
    ],
    subcategory: RequestSubcategory.EMERGENCY_MEDICAL,
  },
  // MEDICAL_EVACUATION
  {
    patterns: [
      /евакуац.*медичн/i, /медичн.*евакуац/i,
      /транспортувати.*хвор/i, /везти.*лікарн/i,
      /доставити.*медзаклад/i,
    ],
    subcategory: RequestSubcategory.MEDICAL_EVACUATION,
  },
  // MEDICATIONS
  {
    patterns: [
      /ліки/i, /препарат/i, /медикамент/i, /таблетк/i,
      /інсулін/i, /серцев.*препарат/i, /антибіотик/i,
      /рецепт/i, /аптека/i,
    ],
    subcategory: RequestSubcategory.MEDICATIONS,
  },
  // MEDICAL_EQUIPMENT
  {
    patterns: [
      /інвалідн.*візок/i, /милиц/i, /апарат.*ШВЛ/i,
      /кисень/i, /крапельниц/i, /бинт|джгут|лангет/i,
      /медичн.*обладнан/i,
    ],
    subcategory: RequestSubcategory.MEDICAL_EQUIPMENT,
  },
  // TEMPORARY_SHELTER
  {
    patterns: [
      /житло/i, /квартир/i, /місце.*проживан/i,
      /ВПО|переміщен.*особ/i, /нікуди.*йти/i,
      /залишилас.*без.*дах/i, /притулок/i,
    ],
    subcategory: RequestSubcategory.TEMPORARY_SHELTER,
  },
  // HUMANITARIAN_CARGO
  {
    patterns: [
      /гуманітарн.*вантаж/i, /доставка.*допомог/i,
      /перевезти.*гуманітар/i, /волонтерськ.*вантаж/i,
    ],
    subcategory: RequestSubcategory.HUMANITARIAN_CARGO,
  },
  // DISPLACEMENT
  {
    patterns: [
      /виїхати/i, /евакуюватис/i, /покинут.*місто/i,
      /добратис.*до/i, /автобус.*евакуац/i,
      /транспорт.*виїзд/i,
    ],
    subcategory: RequestSubcategory.DISPLACEMENT,
  },
  // FOOD_PACKAGE
  {
    patterns: [
      /продукт/i, /їжа/i, /харчуван/i,
      /продуктов.*набір/i, /голодуємо/i, /нема.*їсти/i,
    ],
    subcategory: RequestSubcategory.FOOD_PACKAGE,
  },
  // HOT_MEALS
  {
    patterns: [
      /гаряч.*їж/i, /обід|вечеря|сніданок/i,
      /польова.*кухн/i, /приготувати.*їсти/i,
    ],
    subcategory: RequestSubcategory.HOT_MEALS,
  },
  // PSYCHOLOGICAL_SUPPORT
  {
    patterns: [
      /психолог/i, /стрес|тривог/i, /панічн/i,
      /ПТСР|травм.*досвід/i, /моральн.*підтримк/i,
      /не можу.*спати/i, /депресі/i,
    ],
    subcategory: RequestSubcategory.PSYCHOLOGICAL_SUPPORT,
  },
  // DAMAGE_REPAIR
  {
    patterns: [
      /ремонт/i, /вікн.*виб/i, /дах.*пошкодж/i,
      /стін.*проломлен/i, /відновлен.*будинк/i,
    ],
    subcategory: RequestSubcategory.DAMAGE_REPAIR,
  },
  // DISTANCE_LEARNING
  {
    patterns: [
      /навчан.*дистанційн/i, /дитина.*школа/i,
      /ноутбук.*навчан/i, /інтернет.*уроки/i,
    ],
    subcategory: RequestSubcategory.DISTANCE_LEARNING,
  },
];

@Injectable()
export class VocabularyTaggerService {
  /**
   * Фаза 1–3 алгоритму VBT (розд. 3.3 диплома).
   * Повертає відсортований масив до 3 рекомендованих підкатегорій.
   */
  tag(description: string): TagMatch[] {
    if (!description?.trim()) return [];

    const normalized = description.toLowerCase();
    const matches: TagMatch[] = [];

    for (const entry of VOCABULARY) {
      const matched = entry.patterns.filter(p => p.test(normalized));
      if (matched.length === 0) continue;

      matches.push({
        subcategory: entry.subcategory,
        weight: SUBCATEGORY_WEIGHTS[entry.subcategory],
        matchedKeywords: matched.map(p => p.source),
      });
    }

    // Фаза 3: сортування за вагою спаданням, топ-3
    return matches
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3);
  }

  /**
   * Shorthand: повертає лише назви підкатегорій (для збереження в autoTags[]).
   */
  tagNames(description: string): string[] {
    return this.tag(description).map(m => m.subcategory);
  }
}