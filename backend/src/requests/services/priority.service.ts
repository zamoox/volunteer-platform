import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SUBCATEGORY_WEIGHTS, RequestSubcategory } from '../enums/request-category.enum';

@Injectable()
export class PriorityService {
  // Нормуючий коефіцієнт підсилення зони (alpha у формулі 3.6)
  private readonly ALPHA = 0.5;

  // Оновлені центри ризику під шкалу 0.0 / 0.5 / 1.0
  private readonly riskCenters = [
    { name: 'Активні бойові дії (Південь/Схід)', lat: 46.6354, lng: 32.6169, weight: 1.0, radiusMeters: 45000 }, // Херсон
    { name: 'Тимчасова окупація (Донбас/Крим)', lat: 48.0159, lng: 37.8028, weight: 1.0, radiusMeters: 60000 }, // Донецьк
    { name: 'Зона можливих бойових дій', lat: 49.9935, lng: 36.2304, weight: 0.5, radiusMeters: 30000 }, // Харків (Прифронтова)
  ];

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  private getLambda(subcategory: RequestSubcategory): number {
    const fastDecay = ['EMERGENCY_MEDICAL', 'MEDICAL_EVACUATION'];
    const mediumDecay = ['MEDICATIONS', 'FOOD_PACKAGE', 'HOT_MEALS'];
    
    const sub = String(subcategory); 

    if (fastDecay.includes(sub)) return 0.05;
    if (mediumDecay.includes(sub)) return 0.02;
    return 0.01; // Для всіх інших (TEMPORARY_SHELTER, DAMAGE_REPAIR тощо)
  }

  // Метод, якого не вистачало (з оновленою шкалою)
  getRiskCoefficient(latitude: number, longitude: number): number {
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

    for (const center of this.riskCenters) {
      const distance = getHaversineDistance(latitude, longitude, center.lat, center.lng);
      if (distance <= center.radiusMeters) {
        return center.weight; // Поверне 1.0 або 0.5
      }
    }

    return 0.0; // Безпечна (зелена) зона
  }

  async computeAndSave(
    requestId: string,
    subcategory: RequestSubcategory,
    lat: number,
    lng: number,
    createdAt: Date,
  ): Promise<{ priorityScore: number; riskCoefficient: number }> {

    // 1. Отримуємо коефіцієнт ризику
    const rz = this.getRiskCoefficient(lat, lng);

    // 2. Базова вага підкатегорії
    const wc = SUBCATEGORY_WEIGHTS[subcategory] ?? 0.30;

    // 3. Диференційована лямбда
    const lambda = this.getLambda(subcategory);

    // 4. Часовий розпад (деградація)
    const deltaHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    const td = Math.exp(-lambda * deltaHours); // Мінус гарантує спадання з часом

    // 5. Інтегральна формула (максимум 1.0)
    const rawPS = wc * (1 + this.ALPHA * rz) * td;
    const priorityScore = parseFloat(Math.min(rawPS, 1.0).toFixed(4));

    await this.dataSource
      .createQueryBuilder()
      .update('volunteer_requests')
      .set({ priorityScore, zoneRiskCoefficient: rz })
      .where('id = :id', { id: requestId })
      .execute();

    return { priorityScore, riskCoefficient: rz };
  }

  /**
   * Запит для відображення відсортованих запитів на карті.
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
       FROM  volunteer_requests vr
       WHERE vr.status = 'OPEN'
         AND ST_DWithin(
               vr.coords::geography,
               ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
               $3
             )
       ORDER BY vr.priority_score DESC,
                distance_meters ASC
       LIMIT 100`,
      [lng, lat, radiusMeters],
    );
  }
}