// @ts-expect-error - carbonplan auth types not available
import { Login as LoginBase } from '@carbonplan/auth'
// @ts-expect-error - carbonplan components types not available
import { Link } from '@carbonplan/components'

const Login = () => {
  return (
    <LoginBase
      disclaimer={
        <>
          By viewing Open Climate Risk, you agree to CarbonPlan’s 
          <Link href='https://carbonplan.org/terms'>Terms of Use</Link>
           and 
          <Link href='https://carbonplan.org/privacy'>Privacy Policy</Link>, and
          that Open Climate Risk is in a beta state and may not be used for
          decision-making purposes, cited, or otherwise shared.
        </>
      }
    />
  )
}
export default Login
