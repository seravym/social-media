import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  try {
    const result = await prisma.$queryRaw`
      SELECT current_database()::text AS database
    `

    return NextResponse.json({
      success: true,
      message: 'Database connected successfully!',
      result,
    })
  } catch (error) {
    console.error('Database connection error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
