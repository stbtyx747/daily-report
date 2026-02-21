import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password', 10)

  // -----------------------------------------------
  // Users
  // -----------------------------------------------
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: '管理者',
      email: 'admin@example.com',
      passwordHash,
      role: Role.manager,
      department: '管理部',
    },
  })

  await prisma.user.upsert({
    where: { email: 'sales@example.com' },
    update: {},
    create: {
      name: '山田 太郎',
      email: 'sales@example.com',
      passwordHash,
      role: Role.sales,
      department: '東京営業部',
    },
  })

  // -----------------------------------------------
  // Customers (5 sample records)
  // -----------------------------------------------
  const customerCount = await prisma.customer.count()
  if (customerCount === 0) {
    await prisma.customer.createMany({
      data: [
        {
          name: '佐藤商事',
          companyName: '佐藤商事株式会社',
          department: '購買部',
          industry: '製造業',
          contactName: '佐藤 一郎',
          dealSize: '大',
          phone: '03-1234-5678',
          address: '東京都千代田区丸の内1-1-1',
        },
        {
          name: '鈴木工業',
          companyName: '鈴木工業株式会社',
          department: '資材部',
          industry: '製造業',
          contactName: '鈴木 二郎',
          dealSize: '中',
          phone: '06-2345-6789',
          address: '大阪府大阪市北区梅田2-2-2',
        },
        {
          name: '田中商店',
          companyName: '田中商店株式会社',
          department: '営業部',
          industry: '小売業',
          contactName: '田中 三郎',
          dealSize: '小',
          phone: '052-3456-7890',
          address: '愛知県名古屋市中区栄3-3-3',
        },
        {
          name: '高橋物産',
          companyName: '高橋物産株式会社',
          department: '調達部',
          industry: '卸売業',
          contactName: '高橋 四郎',
          dealSize: '大',
          phone: '092-4567-8901',
          address: '福岡県福岡市博多区博多駅前4-4-4',
        },
        {
          name: '伊藤システム',
          companyName: '伊藤システム株式会社',
          department: 'IT部',
          industry: '情報通信業',
          contactName: '伊藤 五郎',
          dealSize: '中',
          phone: '011-5678-9012',
          address: '北海道札幌市中央区大通西5-5-5',
        },
      ],
    })
  }

  console.log('Seed data inserted successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
