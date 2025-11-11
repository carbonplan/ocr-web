import fs from 'fs'
import matter from 'gray-matter'
import { serialize } from 'next-mdx-remote/serialize'
import slug from 'rehype-slug'
import path from 'path'

import FactorsTable from '../../lib/climate-risk-explainer/components/factors-table'

import ResearchPage from '@/components/research-page'
import { withAuthAndPlausible } from '@/hocs/with-auth-and-plausible'

type Props = {
  back: string
  frontMatter: { color: string; back: string }
  source: Buffer<ArrayBufferLike>
}
const Methods = (props: Props) => {
  return (
    <ResearchPage
      type='supplement'
      source={props.source}
      frontMatter={props.frontMatter}
      figures={{ FactorsTable }}
      back='/research/climate-risk-explainer'
    />
  )
}

export const getStaticProps = async () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'lib/climate-risk-explainer/faq.md'),
  )

  const { content, data } = matter(source)

  const mdxSource = await serialize(content, {
    // Optionally pass remark/rehype plugins
    mdxOptions: {
      rehypePlugins: [slug],
    },
    scope: data,
  })

  return {
    props: {
      source: mdxSource,
      frontMatter: data,
    },
  }
}

export default withAuthAndPlausible(Methods)
