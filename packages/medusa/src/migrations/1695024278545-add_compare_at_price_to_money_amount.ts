import { MigrationInterface, QueryRunner } from "typeorm"

export class AddCompareAtPriceToMoneyAmount1695024278545 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
          ALTER TABLE "money_amount"
              ADD COLUMN IF NOT EXISTS "compare_at_price" integer
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "money_amount"
                DROP COLUMN "compare_at_price"
        `)
    }

}
