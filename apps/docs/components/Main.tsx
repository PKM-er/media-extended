import Giscus from "@giscus/react";
import { useTheme } from "next-themes";
import { useRouter } from "next/router";
import { useMounted } from "nextra/hooks";

export default function Main({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const { pathname, locale } = useRouter();
  const isDark = resolvedTheme === "dark";
  return (
    <>
      {children}
      {locale !== "zh-CN" && (
        <Giscus
          term={pathname}
          repo="PKM-er/media-extended"
          repoId="MDEwOlJlcG9zaXRvcnkzNTQ1NzMzNjE="
          category="Docs Comments"
          categoryId="DIC_kwDOFSJcMc4CdANx"
          mapping="pathname"
          strict="1"
          reactionsEnabled="1"
          emitMetadata="0"
          inputPosition="top"
          loading="lazy"
          theme={mounted && isDark ? "dark" : "light"}
          lang={locale?.startsWith("en-") ? "en" : locale}
        />
      )}
    </>
  );
}
