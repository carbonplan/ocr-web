// @ts-expect-error - carbonplan auth types not available
import { api } from '@carbonplan/auth'

const secret = process.env.JWT_SECRET

const users = [
  {
    username: 'user',
    password: process.env.USER_PASSWORD,
  },
]

const handler = api({ secret, users })

export default handler
