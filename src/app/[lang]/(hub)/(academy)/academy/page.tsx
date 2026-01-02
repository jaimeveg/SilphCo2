import { getDictionary } from "@/i18n/get-dictionary";
import AcademyHeaderLite from "@/components/academy/AcademyHeaderLite";
import ModuleCard from "@/components/academy/ModuleCard";

interface AcademyPageProps {
  params: {
    lang: string;
  };
}

export default async function AcademyPage({ params }: AcademyPageProps) {
  const { lang } = params;
  const dict = await getDictionary(lang as any);
  const data = dict.academy_hub;

  // Labels compartidos para las tarjetas
  const cardLabels = {
    access_btn: data.access_btn,
    view_syllabus: data.view_syllabus,
    view_desc: data.view_desc
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      
      {/* LEFT COLUMN: Sticky Header (Branding & Context) */}
      <aside className="w-full md:w-[35%] lg:w-[30%] md:h-screen md:sticky md:top-0 border-b md:border-b-0 md:border-r border-slate-800 z-10 bg-slate-950">
        <AcademyHeaderLite dict={dict} />
      </aside>

      {/* RIGHT COLUMN: Scrollable Grid (Modules) */}
      <main className="w-full md:w-[65%] lg:w-[70%] bg-slate-950/50">
        <div className="p-6 md:p-12 lg:p-16 max-w-5xl mx-auto">
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {data.modules.map((module: any) => (
              <ModuleCard 
                key={module.id} 
                module={module} 
                lang={lang}
                labels={cardLabels}
              />
            ))}
          </div>

          {/* Bottom Space for scrolling comfort */}
          <div className="h-24" />
        </div>
      </main>

    </div>
  );
}