// @ts-expect-error - carbonplan auth types not available
import { api } from '@carbonplan/auth'

const secret = process.env.JWT_SECRET
const userPassword = process.env.USER_PASSWORD

const users = [
  {
    username: 'user',
    password: userPassword,
  },
  {
    username: 'admin',
    password: userPassword,
  },
]

const handler = api({ secret, users })

export default handler
