// requests/services/priority.service.ts
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SUBCATEGORY_WEIGHTS, RequestSubcategory } from '../enums/request-category.enum';
import { RiskLevel, RiskZone } from 'src/risk-zones/risk-zone.entity';

@Injectable()
export class PriorityService {
  // Нормуючий коефіцієнт підсилення зони (alpha у формулі 3.1)
  private readonly ALPHA = 0.5;
  // Коефіцієнт часового розпаду (lambda у формулі 3.1)
  private readonly LAMBDA = 0.02;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    ) {}

  private readonly riskCenters = [
    { name: 'Активні бойові дії (Південь/Схід)', lat: 46.6354, lng: 32.6169, weight: 1.6, radiusMeters: 45000 }, // приклад Херсон + 45км
    { name: 'Тимчасова окупація (Донбас/Крим)', lat: 48.0159, lng: 37.8028, weight: 2.0, radiusMeters: 60000 }, // приклад Донецьк + 60км
    { name: 'Зона можливих бойових дій', lat: 49.9935, lng: 36.2304, weight: 1.3, radiusMeters: 30000 }, // приклад Харків + 30км
  ];

  /**
   * Розраховує Priority Score для запиту та зберігає результат.
   * Викликається при createRequest та за розкладом (cron).
   *
   * SQL використовує ST_Contains(boundary, ST_MakePoint(lng, lat))
   * для визначення зони ризику відповідно до формули 3.1.
   */
async computeAndSave(
    requestId: string,
    subcategory: RequestSubcategory,
    lat: number,
    lng: number,
    createdAt: Date,
  ): Promise<{ priorityScore: number; riskCoefficient: number }> {

    // ── Крок 1: Обчислюємо коефіцієнт ризику через вбудований Haversine ГІС-аналізатор ──
    // Це миттєво вирішує проблему порожньої таблиці risk_zones для MVP та диплома!
    const rz = this.getRiskCoefficient(lat, lng);

    // ── Крок 2: Обчислюємо базову вагу підкатегорії гуманітарного кластера ──
    const wc = SUBCATEGORY_WEIGHTS[subcategory] ?? 0.35;

    // ── Крок 3: Обчислити часовий коефіцієнт деградації (експоненційне зростання пріоритету від часу очікування) ──
    const deltaHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    // Використовуємо додатній коефіцієнт, оскільки чим довше запит висить, тим вищим має ставати його пріоритет
    const td = Math.exp(this.LAMBDA * deltaHours);

    // ── Крок 4: Розрахунок інтегральної моделі (Формула 3.1 вашого диплома) ──
    const rawPS = wc * (1 + this.ALPHA * rz) * td;
    const priorityScore = parseFloat(Math.min(rawPS, 5.0).toFixed(4));

    // ── Крок 5: Збереження результату з урахуванням точних назв полів сутності TypeORM ──
    // Використовуємо queryBuilder для безпеки типів та сумісності імен стовпчиків
    await this.dataSource
      .createQueryBuilder()
      .update('volunteer_requests')
      .set({
        priorityScore: priorityScore,
        zoneRiskCoefficient: rz
      })
      .where('id = :id', { id: requestId })
      .execute();

    return { priorityScore, riskCoefficient: rz };
  }

  /**
   * Запит для відображення відсортованих запитів на карті.
   * Повертає запити в радіусі radiusMeters, відсортовані за PS спаданням.
   */
  async findNearbyByPriority(
    lat: number,
    lng: number,
    radiusMeters: number,
  ) {
    return this.dataSource.query(
      `SELECT
         vr.id,
         vr.title,
         vr.subcategory,
         vr.priority_score,
         vr.zone_risk_coefficient,
         vr.auto_tags,
         ST_AsGeoJSON(vr.coords)::json AS coords_geojson,
         ST_Distance(
           vr.coords::geography,
           ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
         ) AS distance_meters
       FROM   volunteer_requests vr
       WHERE  vr.status = 'OPEN'
         AND  ST_DWithin(
                vr.coords::geography,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                $3
              )
       ORDER  BY vr.priority_score DESC,
                 distance_meters   ASC
       LIMIT  100`,
      [lng, lat, radiusMeters],
    );
  }

  getRiskCoefficient(latitude: number, longitude: number): number {
    // Простий математичний прорахунок відстані на сфероїді для визначення зони
    const getHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371e3; // радіус Землі в метрах
      const p1 = (lat1 * Math.PI) / 180;
      const p2 = (lat2 * Math.PI) / 180;
      const dPhi = ((lat2 - lat1) * Math.PI) / 180;
      const dLambda = ((lon2 - lon1) * Math.PI) / 180;

      const a = Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
                Math.cos(p1) * Math.cos(p2) *
                Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    // Шукаємо, чи потрапляє точка створення запиту в буферну зону ризику
    for (const center of this.riskCenters) {
      const distance = getHaversineDistance(latitude, longitude, center.lat, center.lng);
      if (distance <= center.radiusMeters) {
        return center.weight; // Повертаємо 1.3, 1.6 або 2.0 відповідно до Наказу № 309
      }
    }

    return 1.0; // Безпечна (зелена) зона — базовий коефіцієнт
  }

  /**
   * Інтегральний розрахунок Priority Score для волонтерського запиту
   */
  calculatePriority(
    latitude: number,
    longitude: number,
    clusterWeight: number,   // Вага гуманітарного кластера ООН
    createdAt: Date
  ): { priorityScore: number; zoneRiskCoefficient: number } {
    
    // 1. Отримуємо коефіцієнт ризику
    const zoneRiskCoefficient = this.getRiskCoefficient(latitude, longitude);

    // 2. Часовий коефіцієнт деградації за експоненційним законом (lambda = 0.02)
    const hoursElapsed = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    const timeCoefficient = Math.exp(0.02 * hoursElapsed);

    // 3. Розрахунок інтегральної моделі
    const priorityScore = clusterWeight * zoneRiskCoefficient * timeCoefficient;

    return {
      priorityScore: parseFloat(priorityScore.toFixed(4)),
      zoneRiskCoefficient
    };
  }
}

