// @ts-expect-error - carbonplan auth types not available
import { api } from '@carbonplan/auth'

const secret = process.env.JWT_SECRET
const USERS = [7, 22, 23, 24]
const users = [
  {
    username: 'admin',
    password: process.env.USER_PASSWORD,
  },
  ...USERS.map((id) => ({
    username: `user_${id}`,
    password: process.env[`USER_PASSWORD_${id}`],
  })),
]
export const USERNAMES = users.map((u) => u.username)

const handler = api({ secret, users })

export default handler
