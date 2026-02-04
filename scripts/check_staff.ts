import { prisma } from '../src/lib/db'

async function main() {
    const staff = await prisma.staff.findMany()
    const users = await prisma.user.findMany({ where: { role: 'TRAINER' } })

    console.log('--- Staff (Calendar) ---')
    console.log(staff)
    console.log('--- Users (Trainers) ---')
    console.log(users.map(u => ({ id: u.id, name: u.name, price: u.unitPrice })))
}

main()
