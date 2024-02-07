import { useRouter } from "next/router";

export default function ICP() {
  const { locale } = useRouter();
  if (locale !== "zh-CN") return null;
  return (
    <a
      className="text-xs"
      href="https://beian.miit.gov.cn/"
      target="_blank"
      rel="noreferrer"
    >
      闽ICP备19020233号-1
    </a>
  );
}