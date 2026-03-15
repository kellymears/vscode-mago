import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { PageNav } from "@/components/page-nav";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Header />

      <div className="mx-auto max-w-6xl px-6">
        <div className="flex gap-10">
          <aside className="hidden lg:block w-56 shrink-0 py-8 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
            <Sidebar />
          </aside>

          <main className="min-w-0 flex-1 py-8 pb-16">
            <article className="mdx-content max-w-3xl">{children}</article>
            <div className="max-w-3xl">
              <PageNav />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
