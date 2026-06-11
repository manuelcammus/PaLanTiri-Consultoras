import { SelectorForm } from "../selector-form";

export default function NuevoSelectorPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">Nuevo selector</h1>
      <p className="mt-1 text-slate-500">Cargá los datos del selector.</p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <SelectorForm />
      </div>
    </div>
  );
}
