// requests/services/priority.service.ts
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SUBCATEGORY_WEIGHTS, RequestSubcategory } from '../enums/request-category.enum';

@Injectable()
export class PriorityService {
  // Нормуючий коефіцієнт підсилення зони (alpha у формулі 3.1)
  private readonly ALPHA = 0.5;
  // Коефіцієнт часового розпаду (lambda у формулі 3.1)
  private readonly LAMBDA = 0.02;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

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

    // ── Крок 1: знайти зону ризику через ST_Contains ──────────────────────
    const zoneResult = await this.dataSource.query<{ risk_coefficient: number }[]>
    (
      `SELECT rz.risk_coefficient
       FROM   risk_zones rz
       WHERE  ST_Contains(
                rz.boundary,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)
              )
       ORDER  BY rz.risk_coefficient DESC  -- беремо максимальний ризик якщо зони перекриваються
       LIMIT  1`,
      [lng, lat], // PostGIS: MakePoint(longitude, latitude)
    );

    const rz = zoneResult[0]?.risk_coefficient ?? 0;

    // ── Крок 2: обчислити базову вагу підкатегорії ────────────────────────
    const wc = SUBCATEGORY_WEIGHTS[subcategory] ?? 0.30;

    // ── Крок 3: обчислити часовий коефіцієнт деградації ──────────────────
    const deltaHours =
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    const td = Math.exp(-this.LAMBDA * deltaHours);

    // ── Крок 4: формула 3.1 ───────────────────────────────────────────────
    const rawPS = wc * (1 + this.ALPHA * rz) * td;
    const priorityScore = Math.min(rawPS, 1.0);

    // ── Крок 5: зберегти результат в таблиці ─────────────────────────────
    await this.dataSource.query(
      `UPDATE volunteer_requests
       SET    priority_score        = $1,
              zone_risk_coefficient = $2
       WHERE  id = $3`,
      [priorityScore, rz, requestId],
    );

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
}