import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllCounties,
  getCountyBySlug,
  getCountiesByState,
  getStateByAbbr,
  getNationalAverage,
  getAllStates,
} from "@/lib/db";
import { ComparisonBar } from "@/components/ComparisonBar";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumb } from "@/components/Breadcrumb";

export const dynamicParams = true;
export const revalidate = 86400;

export function generateStaticParams() {
  return getAllCounties().map((c) => ({ slug: c.slug }));
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const county = getCountyBySlug(slug);
  if (!county) return {};
  return {
    title: `Impuesto a la Propiedad en ${county.county_name}, ${county.state} - ${county.effective_rate.toFixed(2)}%`,
    description: `${county.county_name}, ${county.state} tiene una tasa impositiva efectiva de ${county.effective_rate.toFixed(2)}%. El impuesto anual mediano es ${fmt(county.median_tax)}.`,
    alternates: {
      canonical: `/es/county/${slug}/`,
      languages: { en: `/county/${slug}/`, es: `/es/county/${slug}/`, "x-default": `/county/${slug}/` },
    },
    openGraph: { url: `/es/county/${slug}/` },
  };
}

export default async function CountyPageEs({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const county = getCountyBySlug(slug);
  if (!county) notFound();

  const stateData = getStateByAbbr(county.state);
  const national = getNationalAverage();
  const diffFromNational = county.effective_rate - national.avg_rate;

  return (
    <>
      <Breadcrumb items={[
        { label: "Inicio", href: "/es/" },
        ...(stateData ? [{ label: stateData.state, href: `/es/state/${stateData.slug}/` }] : []),
        { label: county.county_name },
      ]} />

      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        Impuesto a la Propiedad en {county.county_name}, {county.state}
      </h1>
      <p className="text-slate-600 mb-2">
        {county.county_name} tiene una tasa impositiva efectiva de{" "}
        <strong>{county.effective_rate.toFixed(2)}%</strong>, que está{" "}
        {diffFromNational > 0 ? (
          <span className="text-red-600 font-medium">{diffFromNational.toFixed(2)}% por encima</span>
        ) : (
          <span className="text-emerald-600 font-medium">{Math.abs(diffFromNational).toFixed(2)}% por debajo</span>
        )}{" "}
        del promedio nacional.
      </p>
      <p className="text-xs text-slate-400 mt-1 mb-4">
        <a href={`/county/${slug}/`} className="text-blue-500 hover:underline">English version</a>
      </p>

      <AdSlot id="4567890123" />

      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Tasa</div>
          <div className="text-xl font-bold text-blue-800">{county.effective_rate.toFixed(2)}%</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Impuesto Mediano</div>
          <div className="text-xl font-bold text-blue-800">{fmt(county.median_tax)}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Valor de Vivienda</div>
          <div className="text-xl font-bold text-blue-800">{fmt(county.median_home_value)}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Población</div>
          <div className="text-xl font-bold text-blue-800">{county.population.toLocaleString()}</div>
        </div>
      </div>

      {/* Comparación */}
      <h2 className="text-xl font-bold text-slate-800 mb-4">
        Comparación con el Promedio Estatal y Nacional
      </h2>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="px-4 py-2 font-medium text-slate-600">Ubicación</th>
              <th className="px-4 py-2 font-medium text-slate-600 text-right">Tasa</th>
              <th className="px-4 py-2 font-medium text-slate-600 text-right">Impuesto</th>
              <th className="px-4 py-2 font-medium text-slate-600 text-right">Vivienda</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-100 bg-blue-50">
              <td className="px-4 py-2 font-medium">{county.county_name}</td>
              <td className="px-4 py-2 text-right font-medium">{county.effective_rate.toFixed(2)}%</td>
              <td className="px-4 py-2 text-right">{fmt(county.median_tax)}</td>
              <td className="px-4 py-2 text-right">{fmt(county.median_home_value)}</td>
            </tr>
            {stateData && (
              <tr className="border-t border-slate-100">
                <td className="px-4 py-2">{stateData.state} (promedio)</td>
                <td className="px-4 py-2 text-right">{stateData.effective_rate.toFixed(2)}%</td>
                <td className="px-4 py-2 text-right">{fmt(stateData.median_tax)}</td>
                <td className="px-4 py-2 text-right">{fmt(stateData.median_home_value)}</td>
              </tr>
            )}
            <tr className="border-t border-slate-100">
              <td className="px-4 py-2">Promedio Nacional</td>
              <td className="px-4 py-2 text-right">{national.avg_rate.toFixed(2)}%</td>
              <td className="px-4 py-2 text-right">{fmt(national.avg_median_tax)}</td>
              <td className="px-4 py-2 text-right">{fmt(national.avg_home_value)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Barras visuales */}
      <div className="space-y-4 mb-8">
        <div>
          <h3 className="text-sm font-medium text-slate-600 mb-2">Tasa Impositiva Efectiva</h3>
          <ComparisonBar
            bars={[
              { label: county.county_name, value: county.effective_rate },
              ...(stateData ? [{ label: `${stateData.state} prom.`, value: stateData.effective_rate }] : []),
              { label: "Nacional prom.", value: national.avg_rate },
            ]}
            format={(v) => v.toFixed(2) + "%"}
            referenceValue={national.avg_rate}
          />
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-600 mb-2">Impuesto Anual Mediano</h3>
          <ComparisonBar
            bars={[
              { label: county.county_name, value: county.median_tax },
              ...(stateData ? [{ label: `${stateData.state} prom.`, value: stateData.median_tax }] : []),
              { label: "Nacional prom.", value: national.avg_median_tax },
            ]}
            format={fmt}
            referenceValue={national.avg_median_tax}
          />
        </div>
      </div>

      {/* Comparar con otros condados */}
      {(() => {
        const sameState = getCountiesByState(county.state).filter((c) => c.slug !== county.slug).slice(0, 6);
        const topCounties = getAllCounties().filter((c) => c.state !== county.state).slice(0, 6);
        return (
          <section className="mt-8 mb-8">
            <h2 className="text-xl font-bold mb-4">Comparar Impuestos de {county.county_name}</h2>
            {sameState.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">vs Otros Condados de {county.state}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {sameState.map((c) => (
                    <a key={c.slug} href={`/es/county-compare/${county.slug}-vs-${c.slug}/`}
                      className="text-sm px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-blue-700 rounded-full">
                      vs {c.county_name}
                    </a>
                  ))}
                </div>
              </>
            )}
            <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">vs Condados Populares</h3>
            <div className="flex flex-wrap gap-2">
              {topCounties.map((c) => (
                <a key={c.slug} href={`/es/county-compare/${county.slug}-vs-${c.slug}/`}
                  className="text-sm px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-blue-700 rounded-full">
                  vs {c.county_name}, {c.state}
                </a>
              ))}
            </div>
          </section>
        );
      })()}

      <section className="prose prose-slate max-w-none mt-12">
        <h2>Información del Impuesto a la Propiedad de {county.county_name}</h2>
        <p>
          Los propietarios en {county.county_name}, {county.state} pagan un impuesto anual mediano de {fmt(county.median_tax)}.
          La tasa impositiva efectiva de {county.effective_rate.toFixed(2)}% es{" "}
          {diffFromNational > 0 ? "más alta" : "más baja"} que el promedio nacional.
        </p>
      </section>
    </>
  );
}
