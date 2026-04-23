import type { County, State } from './db';

export interface FaqItem {
  question: string;
  answer: string;
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  if (!faqs || faqs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function generateAutoFaqs(
  county: County,
  stateData: State | null,
  national: { avg_rate: number; avg_median_tax: number; avg_home_value: number },
): FaqItem[] {
  return [];
}
