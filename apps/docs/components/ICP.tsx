import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function ICP() {
  const { locale } = useRouter();
  if (locale !== "zh-CN") return null;
  const [isPkmerCN, setIsPkmerCN] = useState(false);
  useEffect(() => {
    window.location.hostname.includes("pkmer.cn") && setIsPkmerCN(true);
  },[])
  return (
    <a
      className={"text-xs " + (isPkmerCN ? "" : "hidden")}
      href="https://beian.miit.gov.cn/"
      target="_blank"
      rel="noreferrer"
    >
      京ICP备2023005152号
    </a>
  );
}