import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPostGISLocation1778802344889 implements MigrationInterface {
    name = 'AddPostGISLocation1778802344889'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "volunteer_requests" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "volunteer_requests" ADD "location" geography(Point,4326)`);
        await queryRunner.query(`CREATE INDEX "IDX_f723846af2bc9c9b1e79fd0aed" ON "volunteer_requests" USING GiST ("location") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_f723846af2bc9c9b1e79fd0aed"`);
        await queryRunner.query(`ALTER TABLE "volunteer_requests" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "volunteer_requests" ADD "location" jsonb NOT NULL`);
    }

}
