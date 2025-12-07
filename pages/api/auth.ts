// @ts-expect-error - carbonplan auth types not available
import { api } from '@carbonplan/auth'

const secret = process.env.JWT_SECRET
const USER_COUNT = 22
const users = [
  {
    username: 'admin',
    password: process.env.USER_PASSWORD,
  },
  ...Array(USER_COUNT)
    .fill(null)
    .map((d, i) => ({
      username: `user_${i + 1}`,
      password: process.env[`USER_PASSWORD_${i + 1}`],
    })),
]
export const USERNAMES = users.map((u) => u.username)

const handler = api({ secret, users })

export default handler
