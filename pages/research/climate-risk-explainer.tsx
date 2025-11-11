import fs from 'fs'
import matter from 'gray-matter'
import { serialize } from 'next-mdx-remote/serialize'
import slug from 'rehype-slug'
import path from 'path'

import ResearchPage from '@/components/research-page'
import { withAuthAndPlausible } from '@/hocs/with-auth-and-plausible'
import OverviewMap from '../../lib/climate-risk-explainer/components/overview-map'
import CountyMap from '../../lib/climate-risk-explainer/components/county-map'
import WindComparison from '../../lib/climate-risk-explainer/components/wind-comparison'
import SummaryTable from '../../lib/climate-risk-explainer/components/summary-table'

type Props = {
  back: string
  frontMatter: { color: string; back: string }
  source: Buffer<ArrayBufferLike>
}
const Article = (props: Props) => {
  return (
    <ResearchPage
      type='article'
      source={props.source}
      frontMatter={props.frontMatter}
      figures={{ OverviewMap, CountyMap, WindComparison, SummaryTable }}
      back='/research/climate-risk'
    />
  )
}

export const getStaticProps = async () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'lib/climate-risk-explainer/index.md'),
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
      frontMatter: { ...data, number: 32 },
    },
  }
}

export default withAuthAndPlausible(Article)
