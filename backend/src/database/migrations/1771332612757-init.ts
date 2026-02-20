import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1771332612757 implements MigrationInterface {
    name = 'Init1771332612757'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "collected_data" DROP CONSTRAINT "collected_data_endpoint_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "endpoints" DROP CONSTRAINT "endpoints_system_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "insights" DROP CONSTRAINT "insights_endpoint_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "insights" DROP CONSTRAINT "insights_system_id_fkey"`);
        await queryRunner.query(`DROP INDEX "public"."idx_collected_data_endpoint_collected"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'dev', 'viewer')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "role" "public"."users_role_enum" NOT NULL DEFAULT 'viewer'`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "is_active" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "collected_data" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "collected_data" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "collected_data" ALTER COLUMN "endpoint_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "collected_data" DROP COLUMN "status"`);
        await queryRunner.query(`CREATE TYPE "public"."collected_data_status_enum" AS ENUM('success', 'error', 'timeout')`);
        await queryRunner.query(`ALTER TABLE "collected_data" ADD "status" "public"."collected_data_status_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "collected_data" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "endpoints" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "endpoints" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "endpoints" ALTER COLUMN "system_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "endpoints" ALTER COLUMN "method" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "endpoints" ALTER COLUMN "is_active" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "endpoints" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "endpoints" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "systems" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "systems" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "systems" DROP COLUMN "auth_type"`);
        await queryRunner.query(`CREATE TYPE "public"."systems_auth_type_enum" AS ENUM('none', 'api_key', 'bearer', 'basic')`);
        await queryRunner.query(`ALTER TABLE "systems" ADD "auth_type" "public"."systems_auth_type_enum" NOT NULL DEFAULT 'none'`);
        await queryRunner.query(`ALTER TABLE "systems" ALTER COLUMN "is_active" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "systems" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "systems" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insights" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "insights" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "insights" DROP COLUMN "type"`);
        await queryRunner.query(`CREATE TYPE "public"."insights_type_enum" AS ENUM('analysis', 'comparison', 'anomaly', 'forecast', 'custom')`);
        await queryRunner.query(`ALTER TABLE "insights" ADD "type" "public"."insights_type_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insights" DROP COLUMN "severity"`);
        await queryRunner.query(`CREATE TYPE "public"."insights_severity_enum" AS ENUM('info', 'warning', 'critical', 'success')`);
        await queryRunner.query(`ALTER TABLE "insights" ADD "severity" "public"."insights_severity_enum" NOT NULL DEFAULT 'info'`);
        await queryRunner.query(`ALTER TABLE "insights" ALTER COLUMN "model_used" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insights" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insights" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_4e702d906e0d25e5093e0ed20e" ON "collected_data" ("endpoint_id", "collected_at") `);
        await queryRunner.query(`ALTER TABLE "collected_data" ADD CONSTRAINT "FK_4aba0e71cbd8ffb821df2a64e7f" FOREIGN KEY ("endpoint_id") REFERENCES "endpoints"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "endpoints" ADD CONSTRAINT "FK_f7b8bb20f9394e22a3a37cfe1b5" FOREIGN KEY ("system_id") REFERENCES "systems"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "insights" ADD CONSTRAINT "FK_be7814a140a30b39df453cf9a54" FOREIGN KEY ("system_id") REFERENCES "systems"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "insights" ADD CONSTRAINT "FK_5131c4f61975dd1eccfd0d11456" FOREIGN KEY ("endpoint_id") REFERENCES "endpoints"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "insights" DROP CONSTRAINT "FK_5131c4f61975dd1eccfd0d11456"`);
        await queryRunner.query(`ALTER TABLE "insights" DROP CONSTRAINT "FK_be7814a140a30b39df453cf9a54"`);
        await queryRunner.query(`ALTER TABLE "endpoints" DROP CONSTRAINT "FK_f7b8bb20f9394e22a3a37cfe1b5"`);
        await queryRunner.query(`ALTER TABLE "collected_data" DROP CONSTRAINT "FK_4aba0e71cbd8ffb821df2a64e7f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4e702d906e0d25e5093e0ed20e"`);
        await queryRunner.query(`ALTER TABLE "insights" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insights" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insights" ALTER COLUMN "model_used" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insights" DROP COLUMN "severity"`);
        await queryRunner.query(`DROP TYPE "public"."insights_severity_enum"`);
        await queryRunner.query(`ALTER TABLE "insights" ADD "severity" character varying DEFAULT 'info'`);
        await queryRunner.query(`ALTER TABLE "insights" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."insights_type_enum"`);
        await queryRunner.query(`ALTER TABLE "insights" ADD "type" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "insights" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "insights" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "systems" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "systems" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "systems" ALTER COLUMN "is_active" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "systems" DROP COLUMN "auth_type"`);
        await queryRunner.query(`DROP TYPE "public"."systems_auth_type_enum"`);
        await queryRunner.query(`ALTER TABLE "systems" ADD "auth_type" character varying DEFAULT 'none'`);
        await queryRunner.query(`ALTER TABLE "systems" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "systems" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "endpoints" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "endpoints" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "endpoints" ALTER COLUMN "is_active" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "endpoints" ALTER COLUMN "method" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "endpoints" ALTER COLUMN "system_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "endpoints" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "endpoints" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "collected_data" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "collected_data" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."collected_data_status_enum"`);
        await queryRunner.query(`ALTER TABLE "collected_data" ADD "status" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "collected_data" ALTER COLUMN "endpoint_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "collected_data" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "collected_data" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "is_active" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "role" character varying NOT NULL DEFAULT 'viewer'`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT extensions.uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`CREATE INDEX "idx_collected_data_endpoint_collected" ON "collected_data" ("collected_at", "endpoint_id") `);
        await queryRunner.query(`ALTER TABLE "insights" ADD CONSTRAINT "insights_system_id_fkey" FOREIGN KEY ("system_id") REFERENCES "systems"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "insights" ADD CONSTRAINT "insights_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "endpoints"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "endpoints" ADD CONSTRAINT "endpoints_system_id_fkey" FOREIGN KEY ("system_id") REFERENCES "systems"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "collected_data" ADD CONSTRAINT "collected_data_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "endpoints"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
