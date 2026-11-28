import { Playground } from "@/features/playground/playground";

export default function Page() {
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-8">
      <h1 className="sr-only">RestLab playground</h1>
      <Playground />
    </main>
  );
}
