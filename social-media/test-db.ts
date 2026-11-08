// testing
import { prisma } from './lib/prisma'

async function main() {
  console.log('update ke database...')

  const newUser = await prisma.user.create({
    data: {
      email: 'budi@example.com',
      name: 'inibudi',
    },
  })
  console.log('Berhasil membuat user:', newUser)

  const allUsers = await prisma.user.findMany()
  console.log('Daftar semua user:', allUsers)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })