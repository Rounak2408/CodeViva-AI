"use client";

const faqs = [
  {
    q: "Does CodeViva work with private repositories?",
    a: "Upload a ZIP for private code. Public GitHub URLs work without tokens; optional GITHUB_TOKEN increases rate limits.",
  },
  {
    q: "How accurate is the AI probability score?",
    a: "It is a blended signal from structure, repetition, naming, and LLM judgment — use it as guidance alongside your own review.",
  },
  {
    q: "Can I share a report with my panel?",
    a: "Yes. Generate a public share link and export a PDF for offline review.",
  },
  {
    q: "What data is stored?",
    a: "Scan metadata and results are stored in your PostgreSQL database. Configure retention and access in your deployment.",
  },
];

export function Faq() {
  return (
    <section className="border-b border-white/5 bg-[#0b0f19] py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          FAQ
        </h2>
        <div className="mt-10 space-y-2">
          {faqs.map((f, i) => (
            <details
              key={i}
              className="group rounded-xl border border-white/10 bg-[#111827]/60 backdrop-blur open:bg-[#111827]/90"
            >
              <summary className="cursor-pointer list-none px-4 py-4 text-left text-sm font-medium text-slate-200 marker:hidden [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-2">
                  <span className="min-w-0 break-words pr-2">{f.q}</span>
                  <span className="text-slate-500 transition group-open:rotate-180">
                    ▾
                  </span>
                </span>
              </summary>
              <p className="border-t border-white/5 px-4 pb-4 text-sm text-slate-400">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
