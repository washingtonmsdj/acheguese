/**
 * ❓ EVENT FAQ
 * 
 * Seção de perguntas frequentes do evento
 * Accordion expansível para reduzir dúvidas
 * 
 * @version 1.0.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface FAQItem {
  question: string;
  answer: string;
}

interface EventFAQProps {
  faqs: FAQItem[];
  title?: string;
}

export function EventFAQ({ faqs, title = 'Perguntas Frequentes' }: EventFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (!faqs || faqs.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-muted/30">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              <HelpCircle className="h-4 w-4" />
              {title}
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              Dúvidas sobre o evento?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Confira as respostas para as perguntas mais comuns
            </p>
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                {/* Question */}
                <button
                  onClick={() => toggleFAQ(index)}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-muted/50 sm:p-6"
                >
                  <span className="text-base font-semibold text-foreground sm:text-lg">
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  </motion.div>
                </button>

                {/* Answer */}
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border bg-muted/30 p-4 sm:p-6">
                        <p className="text-sm text-muted-foreground sm:text-base leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: faqs.length * 0.05 }}
            className="mt-6 rounded-xl border border-border bg-card p-6 text-center"
          >
            <p className="text-sm text-muted-foreground">
              Não encontrou a resposta que procurava?{' '}
              <button className="font-semibold text-primary hover:underline">
                Entre em contato com o organizador
              </button>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
