import FadeIn from './FadeIn';

export default function Problem() {
  return (
    <section className="bg-bg-dark text-white py-32 px-6 md:px-12 text-center">
      <FadeIn>
        <h2 className="font-display text-3xl md:text-[48px] font-medium leading-[1.2] max-w-[900px] mx-auto">
          RAG is broken. Chunks lose context. Embeddings miss meaning. You deserved a better primitive.
        </h2>
      </FadeIn>
    </section>
  );
}
