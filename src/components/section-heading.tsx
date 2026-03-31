type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="font-display text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300/80">
        {eyebrow}
      </p>
      <h2 className="mt-4 font-display text-3xl font-semibold text-white sm:text-4xl">
        <span className="text-gradient-cyan">{title}</span>
      </h2>
      <p className="mt-4 text-base leading-8 text-slate-300 sm:text-lg">
        {description}
      </p>
    </div>
  );
}
