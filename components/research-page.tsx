import {
  Article,
  Cite,
  Endnote,
  PullQuote,
  Sidenote,
  Supplement,
  // @ts-expect-error - carbonplan layouts types not available
} from '@carbonplan/layouts'
import {
  Blockquote,
  Link,
  Colors,
  Figure,
  FigureCaption,
  Table,
  TableCaption,
  // @ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'
import { Box } from 'theme-ui'
import { useMDXComponents } from '@mdx-js/react'
import { useThemedStylesWithMdx } from '@theme-ui/mdx'
import { useRouter } from 'next/router'
import { ComponentType, useEffect } from 'react'
import { MDXRemote } from 'next-mdx-remote'
import references from '../lib/climate-risk-explainer/references.json'

const ARTICLE_COMPONENTS = {
  blockquote: Blockquote,
  Box,
  Link,
  Cite,
  ...Colors,
  Endnote,
  PullQuote,
  Sidenote,
  Figure,
  FigureCaption,
  Table,
  TableCaption,
}
const SUPPLEMENT_COMPONENTS = {
  blockquote: Blockquote,
  Box,
  Link,
}

export type Reference = {
  authors: string
  year: number
  title: string
  journal: string
  url: string
}

type Props = {
  type: 'article' | 'supplement'
  back: string
  frontMatter: { color: string; back: string }
  source: Buffer<ArrayBufferLike>
  figures: Record<string, ComponentType>
}

const ResearchPage = ({ type, source, frontMatter, figures }: Props) => {
  const components = useThemedStylesWithMdx(useMDXComponents())
  const router = useRouter()

  useEffect(() => {
    if (window.location.hash) {
      router.push({ hash: window.location.hash })
    }
  })

  switch (type) {
    case 'article':
      return (
        <>
          <Article
            meta={frontMatter}
            references={references}
            back={frontMatter.back}
          >
            {/* @ts-expect-error - not sure how to make `source` prop work */}
            <MDXRemote
              {...source}
              components={{
                ...components,
                ...ARTICLE_COMPONENTS,
                PullQuote: () => <PullQuote color={frontMatter.color} />,
                ...figures,
              }}
            />
          </Article>
        </>
      )
    case 'supplement':
      return (
        <Supplement meta={frontMatter} back={frontMatter.back}>
          {/* @ts-expect-error - not sure how to make `source` prop work */}
          <MDXRemote
            {...source}
            components={{
              ...components,
              ...SUPPLEMENT_COMPONENTS,
              ...figures,
            }}
          />
        </Supplement>
      )
    default:
      throw new Error(
        `Unexpected page type: ${type}. Must be one of: 'article', 'supplement'.`,
      )
  }
}

export default ResearchPage
