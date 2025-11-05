export default function FormField({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <section className="relative bg-white rounded-2xl max-w-4xl mx-auto lg:p-12 p-6 mb-10 min-h-72 shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
      {children}
    </section>
  );
}

