import clsx from "clsx";

import styles from "./install.module.css";
import Link from "next/link";

export default function LatestBadge({
  href,
  alt = "Latest Release",
  newPage = false,
}: {
  href: string;
  alt?: string;
  newPage?: boolean;
}) {
  const newPageProps = newPage
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  /**
   * @see https://img.shields.io/badge/media_extended-latest-6c31e4?logo=obsidian
   */
  const img = <img src={`/img/obsidian-latest-badge.svg`} alt={alt} />;

  if (href.startsWith("/")) {
    return (
      <Link className={clsx(styles.badge)} href={href} {...newPageProps}>
        {img}
      </Link>
    );
  }
  return (
    <a className={clsx(styles.badge)} href={href} {...newPageProps}>
      {img}
    </a>
  );
}

export const releaseUrl = "https://github.com/PKM-er/media-extended/releases";
