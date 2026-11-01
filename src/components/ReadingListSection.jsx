import { READING_LIST, RELATIONSHIP_THEORIES } from '../data/readingList';
import SectionCard from './SectionCard';

/** Теории отношений и книги о менеджменте и психологии. */
export default function ReadingListSection() {
  return (
    <SectionCard
      title="Что почитать"
      subtitle="Теории, на которые опираются разговоры об отношениях, и короткий список книг. Начните с первых трёх: о командах, парах и системах."
    >
      <div className="space-y-6">
        <div className="grid gap-3 md:grid-cols-2">
          {RELATIONSHIP_THEORIES.map((theory) => (
            <div
              key={theory.key}
              className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4"
            >
              <p className="font-medium text-white">{theory.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{theory.summary}</p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs text-slate-400">
              <tr>
                <th className="py-2 pr-3 font-normal">Книга</th>
                <th className="py-2 pr-3 font-normal">Автор</th>
                <th className="py-2 pr-3 font-normal">Тема</th>
                <th className="py-2 font-normal">Зачем</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {READING_LIST.map((book) => (
                <tr key={book.title} className="border-t border-slate-800">
                  <td className="py-2 pr-3 text-white">{book.title}</td>
                  <td className="py-2 pr-3">{book.author}</td>
                  <td className="py-2 pr-3">{book.topic}</td>
                  <td className="py-2">{book.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>
  );
}
