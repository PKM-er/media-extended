function Version({ children }: { children: React.ReactNode }) {
  return (
    <code className="ml-1 border-black border-opacity-[0.04] bg-opacity-[0.03] bg-black break-words rounded-md border py-0.5 px-[.25em] text-[.9em] dark:border-white/10 dark:bg-white/10">
      {children}
    </code>
  );
}

export default function Versions({ values }: { values: string[] }) {
  return (
    <span>
      {values.map((v, i) => (
        <Version key={i}>{v}</Version>
      ))}
    </span>
  );
}
