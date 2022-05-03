import React, { ReactNode } from "react"
import Head from "next/head"

const absURL = (urlOrPath?: string): string | undefined => {
  if (!urlOrPath) return

  return urlOrPath.startsWith("http")
    ? urlOrPath
    : process.env.NEXT_PUBLIC_SITE! + urlOrPath
}

export const SEO = ({
  title,
  description,
  image,
  imageAlt,
  twitterCard = "summary",
  twitterSite,
  children,
}: {
  title: string
  description?: string
  image?: string
  imageAlt?: string
  twitterCard?: "summary" | "player" | "summary_large_image"
  twitterSite?: string
  children?: ReactNode
}): JSX.Element => {
  const absImg = absURL(image)

  return (
    <Head>
      <title>{title}</title>
      <meta name="twitter:title" property="og:title" content={title} />

      {description ? (
        <>
          <meta name="description" content={description} />
          <meta
            name="twitter:description"
            property="og:description"
            content={description}
          />
        </>
      ) : null}

      {absImg ? (
        <>
          <meta name="twitter:image" property="og:image" content={absImg} />

          {imageAlt ? (
            <meta
              name="twitter:image:alt"
              property="og:image:alt"
              content={imageAlt}
            />
          ) : null}
        </>
      ) : null}

      {twitterCard ? <meta name="twitter:card" content={twitterCard} /> : null}

      {twitterSite ? <meta name="twitter:site" content={twitterSite} /> : null}

      {children}
    </Head>
  )
}
