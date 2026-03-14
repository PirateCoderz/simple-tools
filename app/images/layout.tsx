import Topbar from "@/components/Topbar";

export default function ImagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <Topbar />
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
