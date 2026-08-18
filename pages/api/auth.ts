import { api } from '@carbonplan/auth'

const secret = process.env.JWT_SECRET
const adminPassword = process.env.ADMIN_PASSWORD

const users = [
  {
    username: 'admin',
    password: adminPassword as string,
  },
]

const handler = api({ secret: secret as string, users })

export default handler
