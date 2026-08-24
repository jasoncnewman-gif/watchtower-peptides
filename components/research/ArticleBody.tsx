'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function ArticleBody({ content }: { content: string }) {
  return (
    <div className="article-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Dense/detailed images (infographics) need more width than the
          // narrow prose column — break out toward viewport width instead
          // of shrinking to 768px, where small on-image text becomes illegible.
          img: ({ src, alt }) => (
            <span className="article-image-breakout">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={alt ?? ''} />
            </span>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
